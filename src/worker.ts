import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  FILES_BUCKET: R2Bucket;
  SUPER_ADMIN_EMAIL: string;
  FACULTY_SECRET_KEY: string;
  EMAILJS_SERVICE_ID: string;
  EMAILJS_TEMPLATE_ID: string;
  EMAILJS_PUBLIC_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS
app.use('/*', cors());

const uuid = () => crypto.randomUUID();

// --- HELPER: SEND EMAIL VIA EMAILJS (GMAIL) ---
async function sendEmail(env: Bindings, toEmail: string, otpCode: string) {
  const url = 'https://api.emailjs.com/api/v1.0/email/send';
  const data = {
    service_id: env.EMAILJS_SERVICE_ID,
    template_id: env.EMAILJS_TEMPLATE_ID,
    user_id: env.EMAILJS_PUBLIC_KEY,
    template_params: {
      to_email: toEmail,
      otp: otpCode
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.ok;
  } catch (error) {
    console.error("Email Error:", error);
    return false;
  }
}

// --- 1. AUTH ROUTES ---

// Login / Google Auth Sync
app.post('/api/auth/sync', async (c) => {
  const { uid, email, name, branch } = await c.req.json();
  let role = 'student';
  const superEmail = c.env.SUPER_ADMIN_EMAIL; 
  
  if (email === superEmail) role = 'super_admin';

  try {
      await c.env.DB.prepare(`
        INSERT INTO users (id, email, name, branch, role, created_at) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET name=excluded.name, role=CASE WHEN email=? THEN 'super_admin' ELSE role END
      `).bind(uid, email, name, branch, role, Date.now(), superEmail).run();

      const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
      return c.json(user);
  } catch (e: any) {
      return c.json({ error: e.message }, 500);
  }
});

// 1. SECURE LOGIN & OTP ROUTE
if (path === "/auth/login" && method === "POST") {
    const { email, password } = await request.json() as any;
    
    // Check against HIDDEN Environment Variable (Not hardcoded)
    if (email === env.SUPER_ADMIN_EMAIL) { 
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Store OTP in KV for 5 minutes
        await env.OTP_KV.put(email, otp, { expirationTtl: 300 });
        
        // Send Real Email via EmailJS
        await sendEmailJS(env, email, otp);
        
        return new Response(JSON.stringify({ status: 'OTP_REQUIRED' }), { headers });
    }

    // Normal Student Login
    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ? AND password = ?").bind(email, password).first();
    if(!user) return new Response(JSON.stringify({ error: "Invalid Credentials" }), { status: 401, headers });
    
    return new Response(JSON.stringify({ status: 'SUCCESS', user }), { headers });
}

// 2. VERIFY OTP ROUTE
if (path === "/auth/verify-otp" && method === "POST") {
    const { email, otp } = await request.json() as any;
    const stored = await env.OTP_KV.get(email);
    
    if (stored === otp) {
        await env.OTP_KV.delete(email); // One-time use
        // Return Super Admin Session
        return new Response(JSON.stringify({ 
            status: 'SUCCESS', 
            user: { id: 1, name: "Super Admin", email, role: "super_admin", branch: "ADMIN" } 
        }), { headers });
    }
    return new Response(JSON.stringify({ error: "Invalid OTP" }), { status: 403, headers });
}






// --- 2. SECURE ADMIN OTP ---




app.post('/api/admin/request-otp', async (c) => {
  const { uid, key } = await c.req.json();
  
  if (key !== c.env.FACULTY_SECRET_KEY) {
    return c.json({ error: 'Invalid Key' }, 403);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  await c.env.DB.prepare(`INSERT INTO otps (user_id, code, expires_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET code=excluded.code`).bind(uid, code, Date.now() + 300000).run();

  const emailSuccess = await sendEmail(c.env, c.env.SUPER_ADMIN_EMAIL, code);

  if (emailSuccess) {
    return c.json({ success: true, message: "OTP sent to Super Admin email" });
  } else {
    return c.json({ success: true, message: "Email service busy. Check console logs." });
  }
});

app.post('/api/admin/verify-otp', async (c) => {
  const { uid, code } = await c.req.json();
  const record = await c.env.DB.prepare('SELECT * FROM otps WHERE user_id = ?').bind(uid).first();
  
  if (!record || record.code !== code) {
    return c.json({ error: 'Invalid OTP' }, 403);
  }

  await c.env.DB.prepare("UPDATE users SET role = 'event_admin' WHERE id = ?").bind(uid).run();
  return c.json({ success: true });
});

// POST: Create Event/Notice with File
if (path === "/events" && method === "POST") {
    const formData = await request.formData();
    const file = formData.get('attachment') as File | null;
    let attachmentUrl = null;

    // Upload File to R2 Storage
    if(file && typeof file === 'object') {
        const fileName = `${Date.now()}-${file.name}`;
        await env.FILES_BUCKET.put(fileName, file.stream());
        attachmentUrl = fileName;
    }

    // Save Data to D1 Database
    await env.DB.prepare(`
        INSERT INTO events (title, date, branch, fee, is_paid, description, attachment_url, created_by_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
        formData.get('title'), 
        formData.get('date'), 
        formData.get('branch'), 
        formData.get('fee'), 
        formData.get('isPaid') === 'true' ? 1 : 0, 
        formData.get('desc'), 
        attachmentUrl, 
        formData.get('userEmail')
    ).run();
    
    return new Response(JSON.stringify({ success: true }), { headers });
}


// GOOGLE FAST LOGIN
if (path === "/auth/google" && method === "POST") {
    const { email, name } = await request.json() as any;
    
    // Check if user exists
    let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    
    if (!user) {
        // Auto-Sign Up if new
        await env.DB.prepare(
            "INSERT INTO users (name, email, role, branch, auth_provider) VALUES (?, ?, 'student', 'General', 'google')"
        ).bind(name, email).run();
        user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    }
    return new Response(JSON.stringify({ status: 'SUCCESS', user }), { headers });
}

// MANUAL SIGN UP FORM
if (path === "/auth/register" && method === "POST") {
    const data: any = await request.json();
    
    // Verify Admin Secret (Hidden)
    if (data.roleType === 'super_admin' && data.secretCode !== env.ADMIN_SECRET_KEY) {
        return new Response(JSON.stringify({ error: "Invalid Admin Secret" }), { status: 403, headers });
    }

    try {
        await env.DB.prepare(
            "INSERT INTO users (name, email, password, role, branch, phone) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(data.name, data.email, data.password, data.roleType, data.branch, data.phone).run();
        
        return new Response(JSON.stringify({ success: true }), { headers });
    } catch(e) {
        return new Response(JSON.stringify({ error: "User already exists" }), { status: 400, headers });
    }
}




// --- 3. EVENTS ---

app.get('/api/events', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM events ORDER BY created_at DESC').all();
  return c.json(results);
});

app.post('/api/events', async (c) => {
  const body = await c.req.json();
  await c.env.DB.prepare(`INSERT INTO events (id, title, description, date, type, price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(uuid(), body.title, body.desc, body.date, body.type, body.price, Date.now()).run();
  return c.json({ success: true });
});

// --- 4. REGISTRATION ---

app.post('/api/register', async (c) => {
  const body = await c.req.json();
  await c.env.DB.prepare(`INSERT INTO registrations (id, event_id, user_id, user_name, user_email, status, amount, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(uuid(), body.eventId, body.userId, body.userName, body.userEmail, body.status, body.amount, Date.now()).run();
  return c.json({ success: true });
});

export default app;
