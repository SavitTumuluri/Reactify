import express from "express";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const router = express.Router();

const MOCK = process.env.BEDROCK_MOCK === "1";
const bedrockRegion = process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-2";
const modelId = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20240620-v1:0";
const inferenceProfileArn = process.env.BEDROCK_INFERENCE_PROFILE_ARN || "";

const bedrock = new BedrockRuntimeClient({ region: bedrockRegion });

function makeConverseParams(extras) {
  const arn = (process.env.BEDROCK_INFERENCE_PROFILE_ARN || "").trim();
  const id = (process.env.BEDROCK_MODEL_ID || modelId || "").trim();
  const target = arn ? { inferenceProfileArn: arn } : { modelId: id };
  const out = { ...extras, ...target };
  try {
    if (out.inferenceProfileArn) {
      const tail = String(out.inferenceProfileArn).slice(-12);
      console.log(`[Bedrock] Converse using inferenceProfileArn=...${tail}`);
    } else {
      console.log(`[Bedrock] Converse using modelId=${out.modelId}`);
    }
  } catch (_) {}
  if (!out.modelId && !out.inferenceProfileArn) {
    throw new Error("No modelId or inferenceProfileArn configured for ConverseCommand");
  }
  return out;
}

// GET /api/generate-component/health   <-- final URL (because server mounts at /api)
router.get("/generate-component/health", (_req, res) => {
  res.json({ ok: true, mock: MOCK, modelId, bedrockRegion, inferenceProfileArnSet: Boolean(inferenceProfileArn) });
});

// POST /api/generate-component
router.post("/generate-component", async (req, res) => {
  if (!inferenceProfileArn && /anthropic\.claude/.test(modelId)) {
    return res.status(400).json({
      error: "Anthropic models require an inference profile in this account/region. Set BEDROCK_INFERENCE_PROFILE_ARN or switch to a model that supports on-demand."
    });
  }
  const { name, propsSpec, styleGuide, extras } = req.body || {};
  if (!name || !propsSpec || !styleGuide) {
    return res.status(400).json({ error: "Missing required fields: name, propsSpec, styleGuide" });
  }

  // Mock path for quick verification
  if (MOCK) {
    const mockTSX = `
import React from "react";
/** @typedef {{ name: string; imageUrl: string; role?: string }} Props */
export default function Hi(/** @type {Props} */ props){
  const { name, imageUrl, role } = props;
  return (
    <div className="p-4 border rounded">
      <img src={imageUrl} alt={name} className="h-12 w-12 rounded-full" />
      <div><strong>{name}</strong>{role ? " · " + role : ""}</div>
    </div>
  );
}
/* Usage: <${name} name="Ada" imageUrl="/ada.jpg" role="Engineer" /> */
`.trim();
    return res.json({ code: mockTSX });
  }

  const system = `
You are a senior React engineer. Return ONLY valid single-file TSX (no markdown).
- export default a functional React component named ${name}.
- Props from: ${propsSpec}.
- a11y: labels, alt text, focus-visible.
- Styling: ${styleGuide}.
- Keep deps minimal; include imports if used.
- Add a usage example in a block comment.
${extras ?? ""}`.trim();

  const cmd = new ConverseCommand(makeConverseParams({
    messages: [
      { role: "system", content: [{ text: system }] },
      { role: "user",   content: [{ text: `Create the ${name} component now.` }] },
    ],
  }));

  try {
    const out = await bedrock.send(cmd);
    const text = out?.output?.message?.content?.[0]?.text ?? "";
    return res.json({ code: text });
  } catch (err) {
    console.error("Bedrock error:", {
      name: err?.name, message: err?.message, code: err?.code, $metadata: err?.$metadata
    });
    const msg =
      err?.name === "ModelNotEnabledException" ? "Enable the model in this region."
      : err?.name === "AccessDeniedException" ? "IAM lacks bedrock:InvokeModel for this model ARN."
      : err?.name === "UnrecognizedClientException" ? "Invalid AWS creds or wrong region."
      : err?.message || "Bedrock invocation failed";
    return res.status(500).json({ error: msg });
  }
});

// POST /api/generate-component/svg
// Returns raw inline SVG markup for a simple shape/component matching a short description
router.post("/generate-component/svg", async (req, res) => {
  if (!inferenceProfileArn && /anthropic\.claude/.test(modelId)) {
    return res.status(400).json({
      error: "Anthropic models require an inference profile in this account/region. Set BEDROCK_INFERENCE_PROFILE_ARN or switch to a model that supports on-demand."
    });
  }
  const { description } = req.body || {};
  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "Missing 'description' string" });
  }

  // Quick mock for development: return a star SVG
  if (MOCK) {
    const svg = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Star" role="img" style="width:100%;height:100%;display:block">
  <title>Star</title>
  <polygon points="50,5 61,39 98,39 68,59 79,92 50,72 21,92 32,59 2,39 39,39" fill="#f59e0b" />
</svg>
`.trim();
    return res.json({ svg });
  }

  const system = `
You are a careful SVG generator. Return ONLY raw inline SVG markup (no markdown fence). Requirements:
- Single <svg> element sized for container: include viewBox="0 0 100 100" and no width/height attributes (let CSS size it).
- Self-contained: no external assets, no scripts, no <style> tags. Inline attributes only.
- Accessible: include aria-label and a <title> describing the shape.
- Visual: Fill with pleasing color (#3b82f6 by default). Keep reasonable padding.
`.trim();

  const user = `Make an SVG for: ${description}`;

  const cmd = new ConverseCommand(makeConverseParams({
    messages: [
      { role: "system", content: [{ text: system }] },
      { role: "user",   content: [{ text: user }] },
    ],
  }));

  try {
    const out = await bedrock.send(cmd);
    const text = out?.output?.message?.content?.[0]?.text ?? "";
    // Basic guard: ensure we only return the SVG chunk
    const start = text.indexOf("<svg");
    const end = text.lastIndexOf("</svg>");
    const svg = start >= 0 && end > start ? text.slice(start, end + 6) : text.trim();
    if (!svg.toLowerCase().includes("<svg")) {
      return res.status(502).json({ error: "Model did not return SVG" });
    }
    return res.json({ svg });
  } catch (err) {
    console.error("Bedrock SVG error:", {
      name: err?.name, message: err?.message, code: err?.code, $metadata: err?.$metadata
    });
    const msg =
      err?.name === "ModelNotEnabledException" ? "Enable the model in this region."
      : err?.name === "AccessDeniedException" ? "IAM lacks bedrock:InvokeModel for this model ARN."
      : err?.name === "UnrecognizedClientException" ? "Invalid AWS creds or wrong region."
      : err?.message || "Bedrock invocation failed";
    // Graceful fallback: return a star so the UI shows something useful
    const fallbackStar = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Star" role="img" style="width:100%;height:100%;display:block">
  <title>Star</title>
  <polygon points="50,5 61,39 98,39 68,59 79,92 50,72 21,92 32,59 2,39 39,39" fill="#f59e0b" />
</svg>
`.trim();
    return res.status(200).json({ svg: fallbackStar, fallback: true, error: msg });
  }
});

export default router;
