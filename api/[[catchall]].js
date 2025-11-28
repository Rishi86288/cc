export async function onRequest(context) {
  // Replace with your actual Worker URL
  const WORKER_URL = "https://vite-react-template.rishiforrdp6055.workers.dev";
  
  const url = new URL(context.request.url);
  const workerUrl = new URL(url.pathname, WORKER_URL);
  
  // Forward request to Worker
  const newRequest = new Request(workerUrl, context.request);
  return fetch(newRequest);
}
