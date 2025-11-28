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
    
    // CORS Headers
    const headers = { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", 
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json" 
    };

    if (method === "OPTIONS") return new Response(null, { headers });

    // Prefix '/api' handling
    const path = url.pathname.replace('/api', '');

    try {
        // --- 1. AUTHENTICATION ---
        if (path === "/auth/login" && method === "POST") {
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

        // --- 2. EVENTS ---
        if (path === "/events" && method === "GET") {
            const { results } = await env.DB.prepare("SELECT * FROM events ORDER BY created_at DESC").all();
            return new Response(JSON.stringify(results), { headers });
        }

        // --- 3. FILES ---
        if (path === "/files" && method === "GET") {
            const list = await env.FILES_BUCKET.list();
            const files = list.objects.map(o => ({ name: o.key, size: o.size, date: o.uploaded }));
            return new Response(JSON.stringify(files), { headers });
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
