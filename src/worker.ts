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
  ADMIN_SECRET_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use('/*', cors());

const uuid = () => crypto.randomUUID();

// --- EMAIL HELPER ---
async function sendEmail(env: Bindings, toEmail: string, otpCode: string) {
  const url = 'https://api.emailjs.com/api/v1.0/email/send';
  const data = {
    service_id: env.EMAILJS_SERVICE_ID,
    template_id: env.EMAILJS_TEMPLATE_ID,
    user_id: env.EMAILJS_PUBLIC_KEY,
    template_params: { to_email: toEmail, otp: otpCode }
  };
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return true;
  } catch { return false; }
}

// --- AUTHENTICATION ---

// Login (Password + Super Admin OTP Check)
app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json();
    
    // Super Admin Security Check
    if (email === c.env.SUPER_ADMIN_EMAIL) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Store OTP in D1 (better than KV for consistency)
        await c.env.DB.prepare("INSERT OR REPLACE INTO otps (email, code, expires_at) VALUES (?, ?, ?)").bind(email, otp, Date.now() + 300000).run();
        await sendEmail(c.env, email, otp);
        return c.json({ status: 'OTP_REQUIRED' });
    }

    const user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ? AND password = ?").bind(email, password).first();
    if (!user) return c.json({ error: "Invalid Credentials" }, 401);
    return c.json({ status: 'SUCCESS', user });
});

// Verify OTP
app.post('/api/auth/verify-otp', async (c) => {
    const { email, otp } = await c.req.json();
    const record = await c.env.DB.prepare("SELECT * FROM otps WHERE email = ?").bind(email).first();
    
    if (record && record.code === otp && record.expires_at > Date.now()) {
        await c.env.DB.prepare("DELETE FROM otps WHERE email = ?").bind(email).run();
        return c.json({ status: 'SUCCESS', user: { id: 'super_admin', name: "Super Admin", email, role: "super_admin", branch: "ADMIN" } });
    }
    return c.json({ error: "Invalid or Expired OTP" }, 403);
});

// Google Auth Sync
app.post('/api/auth/sync', async (c) => {
    const { uid, email, name, branch } = await c.req.json();
    let user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    
    if (!user) {
        await c.env.DB.prepare("INSERT INTO users (id, name, email, role, branch, auth_provider, created_at) VALUES (?, ?, ?, 'student', ?, 'google', ?)").bind(uid, name, email, branch, Date.now()).run();
        user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    }
    return c.json(user);
});

// Manual Registration
app.post('/api/auth/register', async (c) => {
    const { name, email, password, role, branch, phone, secretCode } = await c.req.json();
    
    // Admin Secret Check
    if ((role === 'super_admin' || role === 'event_admin') && secretCode !== c.env.ADMIN_SECRET_KEY) {
        return c.json({ error: "Invalid Admin Secret Key" }, 403);
    }

    try {
        const id = uuid();
        await c.env.DB.prepare("INSERT INTO users (id, name, email, password, role, branch, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, name, email, password, role, branch, phone, Date.now()).run();
        return c.json({ status: 'SUCCESS', user: { id, name, email, role, branch } });
    } catch { return c.json({ error: "Email already exists" }, 400); }
});

// --- EVENTS & FILES ---

app.get('/api/events', async (c) => {
    const { results } = await c.env.DB.prepare("SELECT * FROM events ORDER BY created_at DESC").all();
    return c.json(results);
});

app.post('/api/events', async (c) => {
    const body = await c.req.parseBody();
    const file = body['attachment'];
    let url = null;

    if (file instanceof File) {
        const name = `${Date.now()}-${file.name}`;
        await c.env.FILES_BUCKET.put(name, file.stream());
        url = name;
    }

    await c.env.DB.prepare(`INSERT INTO events (id, title, date, branch, fee, is_paid, description, attachment_url, created_by_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(uuid(), body['title'], body['date'], body['branch'], body['fee'], body['isPaid'] === 'true' ? 1 : 0, body['desc'], url, body['userEmail'], Date.now()).run();

    return c.json({ success: true });
});

app.get('/api/files', async (c) => {
    const list = await c.env.FILES_BUCKET.list();
    return c.json(list.objects.map(o => ({ name: o.key, size: o.size, date: o.uploaded })));
});

app.put('/api/files', async (c) => {
    const body = await c.req.parseBody();
    const file = body['file'];
    if (file instanceof File) {
        await c.env.FILES_BUCKET.put(file.name, file.stream());
        return c.json({ success: true });
    }
    return c.json({ error: "No file" }, 400);
});

export default app;
