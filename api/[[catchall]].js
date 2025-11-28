export async function onRequest(context) {
  // Service Binding name, confirmed from your screenshot.
  // Must match the binding name in snake_case on context.env.
  const WORKER_BINDING_NAME = 'cipet_portal'; 

  const workerService = context.env[WORKER_BINDING_NAME];
  
  if (!workerService || typeof workerService.fetch !== 'function') {
      return new Response(`Binding Error 500: Worker binding '${WORKER_BINDING_NAME}' not found in environment.`, { status: 500 });
  }

  // Pass the original request object directly to the bound Worker's fetch method.
  // Pages automatically strips the /api/ prefix.
  try {
      return await workerService.fetch(context.request);
  } catch (e) {
      console.error(`Worker Execution Error (${WORKER_BINDING_NAME}):`, e);
      // This indicates the Worker failed internally (e.g., D1, secret access failure).
      return new Response(`Internal Worker Error 500: Worker execution failed. Check worker logs.`, { status: 500 });
  }
}
