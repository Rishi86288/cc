export async function onRequest(context) {
  // --- Configuration ---
  // Worker's public URL (as deployed)
  const WORKER_URL = "https://cipet-portal.rishiforrdp6055.workers.dev";
  
  // --- Pages Function Logic ---

  // 1. Get the path suffix after the /api/ prefix.
  // Example: If request.url is https://pages.dev/api/auth/login
  //          context.functionPath is /api/[[catchall]]
  //          context.params.catchall is ['auth', 'login']
  // We want the path to be /auth/login for the Hono worker.
  
  const pathname = new URL(context.request.url).pathname;
  // Reliably strip the '/api' prefix and ensure it starts with a '/'
  const workerPath = pathname.replace(/^\/api/, '');
  
  // 2. Create the URL for the Worker, using the worker's URL as the base
  const workerUrl = new URL(workerPath, WORKER_URL);

  // 3. Clone the incoming request for the proxy, using the new Worker URL
  const newRequest = new Request(workerUrl.toString(), {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
    redirect: 'manual', // Important for proxying POST/PUT requests
  });
  
  // 4. Perform the fetch to the public Worker URL
  try {
      return await fetch(newRequest);
  } catch (e) {
      console.error("Worker Proxy Error:", e);
      return new Response(`Proxy Error 503: Could not reach Worker at ${WORKER_URL}.`, { status: 503 });
  }
}
