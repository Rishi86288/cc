import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  FILES_BUCKET: R2Bucket;
  OTP_KV: KVNamespace;
  SUPER_ADMIN_EMAIL: string;
  FACULTY_SECRET_KEY: string;
  EMAILJS_SERVICE_ID: string;
  EMAILJS_TEMPLATE_ID: string;
  EMAILJS_PUBLIC_KEY: string;
  ADMIN_SECRET_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for all routes
app.use('/*', cors({
  origin: '*', // In production, change this to your pages.dev URL
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));

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

// --- ROUTES ---
// Note: No /api prefix here because the proxy strips it or forwards to root

// 1. Login
app.post('/auth/login', async (c) => {
    try {
        const { email, password } = await c.req.json();
        
        if (email === c.env.SUPER_ADMIN_EMAIL) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            await c.env.OTP_KV.put(email, otp, { expirationTtl: 300 });
            await sendEmail(c.env, email, otp);
            return c.json({ status: 'OTP_REQUIRED' });
        }

        const user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ? AND password = ?").bind(email, password).first();
        if (!user) return c.json({ error: "Invalid Credentials" }, 401);
        return c.json({ status: 'SUCCESS', user });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// 2. Verify OTP
app.post('/auth/verify-otp', async (c) => {
    const { email, otp } = await c.req.json();
    const stored = await c.env.OTP_KV.get(email);
    
    if (stored === otp) {
        await c.env.OTP_KV.delete(email);
        return c.json({ status: 'SUCCESS', user: { id: 'super_admin', name: "Super Admin", email, role: "super_admin", branch: "ADMIN" } });
    }
    return c.json({ error: "Invalid OTP" }, 403);
});

// 3. Google Sync
app.post('/auth/sync', async (c) => {
    const { uid, email, name, branch } = await c.req.json();
    let user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    
    if (!user) {
        await c.env.DB.prepare("INSERT INTO users (id, name, email, role, branch, auth_provider, created_at) VALUES (?, ?, ?, 'student', ?, 'google', ?)").bind(uid, name, email, branch, Date.now()).run();
        user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    }
    return c.json(user);
});

// 4. Register
app.post('/auth/register', async (c) => {
    const data = await c.req.json();
    
    if ((data.roleType === 'super_admin' || data.roleType === 'event_admin') && data.secretCode !== c.env.ADMIN_SECRET_KEY) {
        return c.json({ error: "Invalid Secret" }, 403);
    }

    try {
        const id = uuid();
        await c.env.DB.prepare("INSERT INTO users (id, name, email, password, role, branch, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, data.name, data.email, data.password, data.roleType, data.branch, data.phone || '', Date.now()).run();
        return c.json({ status: 'SUCCESS', user: { id, ...data } });
    } catch { return c.json({ error: "Email exists" }, 400); }
});

// 5. Events
app.get('/events', async (c) => {
    const { results } = await c.env.DB.prepare("SELECT * FROM events ORDER BY created_at DESC").all();
    return c.json(results);
});

app.post('/events', async (c) => {
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

// 6. Files
app.get('/files', async (c) => {
    const list = await c.env.FILES_BUCKET.list();
    return c.json(list.objects.map(o => ({ name: o.key, size: o.size, date: o.uploaded })));
});

app.put('/files', async (c) => {
    const body = await c.req.parseBody();
    const file = body['file'];
    if (file instanceof File) {
        await c.env.FILES_BUCKET.put(file.name, file.stream());
        return c.json({ success: true });
    }
    return c.json({ error: "No file" }, 400);
});

app.delete('/files/:name', async (c) => {
    const name = c.req.param('name');
    await c.env.FILES_BUCKET.delete(decodeURIComponent(name));
    return c.json({ success: true });
});

// 7. User/Admin Features
app.put('/user/profile', async (c) => {
    const { name, branch, phone, email } = await c.req.json();
    await c.env.DB.prepare("UPDATE users SET name=?, branch=?, phone=? WHERE email=?").bind(name, branch, phone, email).run();
    return c.json({ success: true });
});

app.post('/user/upgrade', async (c) => {
    const { id } = await c.req.json();
    await c.env.DB.prepare("UPDATE users SET upgrade_status='pending' WHERE id=?").bind(id).run();
    return c.json({ success: true });
});

app.get('/admin/upgrades', async (c) => {
    const { results } = await c.env.DB.prepare("SELECT * FROM users WHERE upgrade_status='pending'").all();
    return c.json(results);
});

app.post('/admin/approve', async (c) => {
    const { userId, secret } = await c.req.json();
    if(secret !== c.env.ADMIN_SECRET_KEY) return c.json({ error: "Invalid Key" }, 403);
    await c.env.DB.prepare("UPDATE users SET role='event_admin', upgrade_status='approved' WHERE id=?").bind(userId).run();
    return c.json({ success: true });
});

export default app;
