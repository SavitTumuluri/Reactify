const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5006";

export async function generateAISVG(description) {
  const r = await fetch(`${BASE}/api/ai/svg`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description })
  });
  if (!r.ok) throw new Error(await r.text());
  const { svg } = await r.json();
  return svg;
}

export async function generateAIComponent(description) {
  const r = await fetch(`${BASE}/api/ai/react`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description })
  });
  if (!r.ok) throw new Error(await r.text());
  const { code } = await r.json();
  return code;
}

export async function rewriteIRWithAgent(description, state) {
  const r = await fetch(`${BASE}/api/ai/agent/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, state })
  });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();
}
