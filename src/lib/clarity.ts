const CLARITY_PLACEHOLDER = ["YOUR", "CLARITY", "PROJECT", "ID"].join("_");

let clarityLoaded = false;

export function initClarity() {
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID;

  if (!projectId || projectId === CLARITY_PLACEHOLDER || clarityLoaded) {
    return;
  }

  clarityLoaded = true;

  const clarityQueue = function (...args: unknown[]) {
    clarityQueue.q = clarityQueue.q || [];
    clarityQueue.q.push(args);
  } as ((...args: unknown[]) => void) & { q?: unknown[][] };

  window.clarity = window.clarity || clarityQueue;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${projectId}`;

  const firstScript = document.getElementsByTagName("script")[0];
  firstScript.parentNode?.insertBefore(script, firstScript);
}

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}
