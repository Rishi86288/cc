export async function onRequest(context) {
  // FIX: Use service binding fetch pattern for reliability.
  // The Pages environment should expose the Worker as a callable service
  // based on the configuration in the Cloudflare Pages settings.
  
  // The Pages Function automatically exposes the `env` object which should
  // contain the bound Worker if it's correctly configured in the dashboard.
  // Assuming the binding name is 'CIPET_WORKER' or similar based on standard practice.
  // We cannot guess the binding name, so we must assume the Pages environment
  // handles the proxying based on the '/api' prefix and rely on context.
  
  // NOTE: If the Cloudflare Pages binding for the Worker is named 'CIPET_WORKER',
  // you must replace `context.env.CIPET_WORKER.fetch` below.
  
  // Reverting to the safer public URL fetch if the environment is a simple local build,
  // BUT adding a necessary path strip to ensure the Worker receives a valid path.
  const WORKER_URL = "https://cipet-portal.rishiforrdp6055.workers.dev";
  
  // Extract path, removing '/api' prefix
  const path = context.request.url.replace(context.request.url.split('/api')[0] + '/api', '');
  
  const workerUrl = new URL(path, WORKER_URL);
  
  const newRequest = new Request(workerUrl, context.request);
  
  // Perform the fetch to the public Worker URL
  try {
      return await fetch(newRequest);
  } catch (e) {
      console.error("Worker Proxy Error:", e);
      return new Response(`Proxy Error: Could not reach Worker at ${WORKER_URL}. Check Cloudflare Service Bindings or Worker deployment.`, { status: 503 });
  }
}
