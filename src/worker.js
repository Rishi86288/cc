import { D1Database, R2Bucket, KVNamespace } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  FILES_BUCKET: R2Bucket;
  OTP_KV: KVNamespace;
  SUPER_ADMIN_EMAIL: string;
  EMAILJS_SERVICE_ID: string;
  EMAILJS_TEMPLATE_ID: string;
  EMAILJS_PUBLIC_KEY: string;
  ADMIN_SECRET_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    
    const headers = { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Methods": "*", 
      "Access-Control-Allow-Headers": "*",
      "Content-Type": "application/json" 
    };

    if (method === "OPTIONS") return new Response(null, { headers });

    try {
        // --- AUTHENTICATION ---
        if (url.pathname === "/api/auth/login" && method === "POST") {
            const { email, password } = await request.json() as any;
            
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

        if (url.pathname === "/api/auth/verify-otp" && method === "POST") {
            const { email, otp } = await request.json() as any;
            const stored = await env.OTP_KV.get(email);
            if (stored === otp) {
                await env.OTP_KV.delete(email);
                return new Response(JSON.stringify({ status: 'SUCCESS', user: { id: 1, name: "Super Admin", email, role: "super_admin", branch: "ADMIN" } }), { headers });
            }
            return new Response(JSON.stringify({ error: "Invalid OTP" }), { status: 403, headers });
        }

        if (url.pathname === "/api/auth/register" && method === "POST") {
            const data: any = await request.json();
            try {
                await env.DB.prepare("INSERT INTO users (name, email, password, role, branch) VALUES (?, ?, ?, ?, ?)").bind(data.name, data.email, data.password, data.roleType, data.branch).run();
                const newUser = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(data.email).first();
                return new Response(JSON.stringify({ status: 'SUCCESS', user: newUser }), { headers });
            } catch(e) {
                return new Response(JSON.stringify({ error: "User exists" }), { status: 400, headers });
            }
        }

        // --- PROFILE & UPGRADES ---

        // Update Profile
        if (url.pathname === "/api/user/profile" && method === "PUT") {
            const { id, name, branch, phone } = await request.json() as any;
            await env.DB.prepare("UPDATE users SET name = ?, branch = ?, phone = ? WHERE id = ?").bind(name, branch, phone, id).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // Request Upgrade to Admin
        if (url.pathname === "/api/user/upgrade" && method === "POST") {
            const { id } = await request.json() as any;
            await env.DB.prepare("UPDATE users SET upgrade_status = 'pending' WHERE id = ?").bind(id).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // Get Pending Upgrades (Super Admin)
        if (url.pathname === "/api/admin/upgrades" && method === "GET") {
            const { results } = await env.DB.prepare("SELECT * FROM users WHERE upgrade_status = 'pending'").all();
            return new Response(JSON.stringify(results), { headers });
        }

        // Approve Upgrade
        if (url.pathname === "/api/admin/approve" && method === "POST") {
            const { userId, secret } = await request.json() as any;
            
            // Security Check
            if (secret !== env.ADMIN_SECRET_KEY) return new Response(JSON.stringify({ error: "Invalid Admin Key" }), { status: 403, headers });

            await env.DB.prepare("UPDATE users SET role = 'event_admin', upgrade_status = 'approved' WHERE id = ?").bind(userId).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // --- EVENTS ---
        
        if (url.pathname === "/api/events" && method === "POST") {
            const formData = await request.formData();
            const file = formData.get('attachment') as File | null;
            if(file) await env.FILES_BUCKET.put(file.name, file.stream());

            await env.DB.prepare("INSERT INTO events (title, date, branch, fee, is_paid, description, attachment_url, created_by_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
              formData.get('title'), formData.get('date'), formData.get('branch'), formData.get('fee'), 
              formData.get('isPaid') === 'true' ? 1 : 0, formData.get('desc'), file ? file.name : null, formData.get('email')
            ).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (url.pathname === "/api/events" && method === "GET") {
            const { results } = await env.DB.prepare("SELECT * FROM events ORDER BY created_at DESC").all();
            return new Response(JSON.stringify(results), { headers });
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
