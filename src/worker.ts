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
