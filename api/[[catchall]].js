export async function onRequest(context) {
  // FIXED: Pointing to the correct worker name 'cipet-portal'
  const WORKER_URL = "cipet-portal.rishiforrdp6055.workers.dev";
  
  const url = new URL(context.request.url);
  // Ensure the path passed to the worker is correct
  const workerUrl = new URL(url.pathname, WORKER_URL);
  
  const newRequest = new Request(workerUrl, context.request);
  return fetch(newRequest);
}
