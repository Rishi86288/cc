import { D1Database, R2Bucket, KVNamespace } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  FILES_BUCKET: R2Bucket;
  OTP_KV: KVNamespace;
  SUPER_ADMIN_EMAIL: string;
  FACULTY_SECRET_KEY: string;
  EMAILJS_SERVICE_ID: string;
  EMAILJS_TEMPLATE_ID: string;
  EMAILJS_PUBLIC_KEY: string;
  ADMIN_SECRET_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    
    // CORS Headers
    const headers = { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", 
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json" 
    };

    if (method === "OPTIONS") return new Response(null, { headers });

    // ROBUST PATH HANDLING
    // Removes '/api' if present, so '/api/auth/login' becomes '/auth/login'
    const path = url.pathname.replace(/^\/api/, '');

    try {
        // --- 1. AUTHENTICATION ---
        
        // LOGIN
        if (path === "/auth/login" && method === "POST") {
            const { email, password } = await request.json() as any;
            
            // Super Admin Check
            if (email === env.SUPER_ADMIN_EMAIL) { 
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                await env.OTP_KV.put(email, otp, { expirationTtl: 300 });
                await sendEmailJS(env, email, otp);
                return new Response(JSON.stringify({ status: 'OTP_REQUIRED' }), { headers });
            }

            const user = await env.DB.prepare("SELECT * FROM users WHERE email = ? AND password = ?").bind(email, password).first();
            if(!user) return new Response(JSON.stringify({ error: "Invalid Credentials" }), { status: 401, headers });
            
            return new Response(JSON.stringify({ status: 'SUCCESS', user }), { headers });
        }

        // GOOGLE SYNC
        if (path === "/auth/sync" && method === "POST") {
            const { uid, email, name, branch } = await request.json() as any;
            let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
            
            if (!user) {
                await env.DB.prepare("INSERT INTO users (id, name, email, role, branch, auth_provider, created_at) VALUES (?, ?, ?, 'student', ?, 'google', ?)").bind(uid, name, email, branch, Date.now()).run();
                user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
            }
            return new Response(JSON.stringify({ status: 'SUCCESS', user }), { headers });
        }

        // REGISTER
        if (path === "/auth/register" && method === "POST") {
            const data: any = await request.json();
            
            if ((data.roleType === 'super_admin' || data.roleType === 'event_admin') && data.secretCode !== env.ADMIN_SECRET_KEY) {
                return new Response(JSON.stringify({ error: "Invalid Admin Secret Key" }), { status: 403, headers });
            }

            try {
                const id = crypto.randomUUID();
                await env.DB.prepare("INSERT INTO users (id, name, email, password, role, branch, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, data.name, data.email, data.password, data.roleType, data.branch, data.phone || '', Date.now()).run();
                return new Response(JSON.stringify({ status: 'SUCCESS', user: { id, ...data } }), { headers });
            } catch { return new Response(JSON.stringify({ error: "Email already exists" }), { status: 400, headers }); }
        }

        // VERIFY OTP
        if (path === "/auth/verify-otp" && method === "POST") {
            const { email, otp } = await request.json() as any;
            const stored = await env.OTP_KV.get(email);
            if (stored === otp) {
                await env.OTP_KV.delete(email);
                return new Response(JSON.stringify({ status: 'SUCCESS', user: { id: 'super_admin', name: "Super Admin", email, role: "super_admin", branch: "ADMIN" } }), { headers });
            }
            return new Response(JSON.stringify({ error: "Invalid OTP" }), { status: 403, headers });
        }

        // --- 2. EVENTS ---
        if (path === "/events" && method === "GET") {
            const { results } = await env.DB.prepare("SELECT * FROM events ORDER BY created_at DESC").all();
            return new Response(JSON.stringify(results), { headers });
        }

        if (path === "/events" && method === "POST") {
            const formData = await request.formData();
            const file = formData.get('attachment');
            let url = null;

            if(file && typeof file === 'object') {
                const name = `${Date.now()}-${file.name}`;
                await env.FILES_BUCKET.put(name, file.stream());
                url = name;
            }

            await env.DB.prepare("INSERT INTO events (id, title, date, branch, fee, is_paid, description, attachment_url, created_by_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
              crypto.randomUUID(), formData.get('title'), formData.get('date'), formData.get('branch'), formData.get('fee'), 
              formData.get('isPaid') === 'true' ? 1 : 0, formData.get('desc'), url, formData.get('userEmail'), Date.now()
            ).run();
            
            return new Response(JSON.stringify({ success: true }), { headers });
        }
        
        // --- 3. FILES ---
        if (path === "/files" && method === "GET") {
             const list = await env.FILES_BUCKET.list();
             const files = list.objects.map(o => ({ name: o.key, size: o.size, date: o.uploaded }));
             return new Response(JSON.stringify(files), { headers });
        }

        if (path === "/files" && method === "PUT") {
             const formData = await request.formData();
             const file = formData.get('file') as File;
             if(file) await env.FILES_BUCKET.put(file.name, file.stream());
             return new Response(JSON.stringify({ success: true }), { headers });
        }
        
        if (path.startsWith("/files/") && method === "DELETE") {
            const name = path.split('/').pop();
            if(name) await env.FILES_BUCKET.delete(decodeURIComponent(name));
             return new Response(JSON.stringify({ success: true }), { headers });
        }

        return new Response("Not Found", { status: 404, headers });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }
};

async function sendEmailJS(env: Env, to: string, otp: string) {
  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: env.EMAILJS_SERVICE_ID,
        template_id: env.EMAILJS_TEMPLATE_ID,
        user_id: env.EMAILJS_PUBLIC_KEY,
        template_params: { to_email: to, otp: otp }
      })
    });
  } catch (e) { console.error(e); }
}
