export async function onRequest(context) {
  // REPLACE WITH YOUR ACTUAL WORKER URL (Found in Cloudflare Dashboard -> Workers)
  const WORKER_URL ="https://vite-react-template.rishiforrdp6055.workers.dev";
  
  const url = new URL(context.request.url);
  const workerUrl = new URL(url.pathname, WORKER_URL);
  const newRequest = new Request(workerUrl, context.request);
  return fetch(newRequest);
}
