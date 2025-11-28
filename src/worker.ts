import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  // Only bindings relevant to the remaining Worker functions
  OTP_KV: KVNamespace;
  SUPER_ADMIN_EMAIL: string;
  EMAILJS_SERVICE_ID: string;
  EMAILJS_TEMPLATE_ID: string;
  EMAILJS_PUBLIC_KEY: string;
  ADMIN_SECRET_KEY: string;

  // R2 Bindings left for file download/upload (if Firebase Storage is not used)
  FILES_BUCKET: R2Bucket;
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

// 1. Verify OTP (POST /auth/verify-otp) - Still required for Super Admin 2FA
app.post('/auth/verify-otp', async (c) => {
    const { email, otp } = await c.req.json();
    const stored = await c.env.OTP_KV.get(email);
    
    if (stored === otp) {
        await c.env.OTP_KV.delete(email);
        // Returns the expected user structure for the frontend to merge
        return c.json({ status: 'SUCCESS', user: { uid: 'super_admin_placeholder', name: "Super Admin", email, role: "super_admin", branch: "ADMIN" } });
    }
    return c.json({ error: "Invalid OTP" }, 403);
});

// NOTE: All other AUTH, USER, EVENTS, UPGRADES routes have been removed
// as they are handled directly by the frontend using Firebase Firestore.

// --- FILE MANAGEMENT (If using R2 for files instead of Firebase Storage) ---
// These routes are kept for completeness if you use R2 for large files.
// The frontend *currently* uses Firebase Storage, so these routes are likely unused.

// 2. File Listing (GET /files)
app.get('/files', async (c) => {
    // This is retained if you use R2/Worker for file management.
    // NOTE: Frontend FileManager component now uses Firebase Storage directly.
    const list = await c.env.FILES_BUCKET.list();
    return c.json(list.objects.map(o => ({ name: o.key, size: o.size, date: o.uploaded })));
});

// 3. File Upload (PUT /files)
app.put('/files', async (c) => {
    const body = await c.req.parseBody();
    const file = body['file'];
    if (file instanceof File) {
        await c.env.FILES_BUCKET.put(file.name, file.stream());
        return c.json({ success: true });
    }
    return c.json({ error: "No file" }, 400);
});

// 4. File Deletion (DELETE /files/:name)
app.delete('/files/:name', async (c) => {
    const name = c.req.param('name');
    await c.env.FILES_BUCKET.delete(decodeURIComponent(name));
    return c.json({ success: true });
});

// 5. Catch-all for non-existent routes
app.all('*', (c) => c.text('Worker is running, but no route matched (404).', 404));


export default app;
