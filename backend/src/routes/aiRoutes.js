import express from "express";
import { BedrockRuntimeClient, InvokeModelCommand, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const router = express.Router();

const REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-2";
const MODEL_ID = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20240620-v1:0";
const INFERENCE_PROFILE_ARN = process.env.BEDROCK_INFERENCE_PROFILE_ARN || "";

const bedrock = new BedrockRuntimeClient({ region: REGION });

// Shared system prompt for React IR code
const SYSTEM_IR = `
You are a code generator for a canvas editor that exports static React.
- Only emit valid React/JSX or inline <svg> markup as requested.
- When emitting React, use the app's static components produced by IR nodes' toReact():
  <DragResizeStatic shapeType="rectangle|circle|triangle|star" posRel={{x:..,y:..}} sizeRel={{w:..,h:..}} angle={...} styles={{...}}>
    ...children...
  </DragResizeStatic>
- Keep code deterministic/pure. Do not use hooks/effects.
- Prefer simple inline styles (e.g., backgroundColor, borderRadius, clipPath for shapes).
`;

// Prefer inference profile when set; otherwise fall back to modelId
function makeInvokeParams(bodyJson) {
  const common = {
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(bodyJson),
  };
  const arn = (process.env.BEDROCK_INFERENCE_PROFILE_ARN || "").trim();
  if (arn) return { inferenceProfileArn: arn, ...common };
  const modelId = (process.env.BEDROCK_MODEL_ID || MODEL_ID || "").trim();
  if (modelId) return { modelId, ...common };
  throw new Error("No modelId or inferenceProfileArn set in environment variables");
}

function logTarget(params) {
  try {
    if (params.inferenceProfileArn) {
      const arn = String(params.inferenceProfileArn);
      console.log(`[AI] Using inferenceProfileArn=...${arn.slice(-12)}`);
    } else if (params.modelId) {
      console.log(`[AI] Using modelId=${params.modelId}`);
    } else {
      console.warn("[AI] Neither modelId nor inferenceProfileArn present in params");
    }
  } catch (_) {}
}

// function makeConverseParams(extras) {
//   const arn = (process.env.BEDROCK_INFERENCE_PROFILE_ARN || "").trim();
//   const id = (process.env.BEDROCK_MODEL_ID || MODEL_ID || "").trim();
//   const target = arn ? { inferenceProfileArn: arn } : { modelId: id };
//   const out = { ...extras, ...target };
//   logTarget(out);
//   if (!out.modelId && !out.inferenceProfileArn) {
//     throw new Error("No modelId or inferenceProfileArn configured for ConverseCommand");
//   }
//   return out;
// }

function makeConverseParams(extras) {
  const arn = (process.env.BEDROCK_INFERENCE_PROFILE_ARN || "").trim();
  const id = (process.env.BEDROCK_MODEL_ID || MODEL_ID || "").trim();

  // --- Fix: include both ARN and modelId if ARN is set ---
  if (arn) {
    const out = { modelId: id, inferenceProfileArn: arn, ...extras };
    logTarget(out);
    return out;
  }

  if (id) {
    const out = { modelId: id, ...extras };
    logTarget(out);
    return out;
  }

  throw new Error("No modelId or inferenceProfileArn configured for ConverseCommand");
}




// Health endpoint to inspect env and effective target
router.get("/ai/health", (_req, res) => {
  const envModel = (process.env.BEDROCK_MODEL_ID || "").trim();
  const envArn = (process.env.BEDROCK_INFERENCE_PROFILE_ARN || "").trim();
  const target = envArn
    ? { type: "inferenceProfileArn", value: envArn.replace(/^(arn:[^:]*:[^:]*:[^:]*:[^:]*:inference-profile\/).*/, "arn:.../inference-profile/") + envArn.slice(-16) }
    : { type: "modelId", value: envModel || MODEL_ID };
  res.json({
    ok: true,
    region: REGION,
    defaults: { MODEL_ID },
    env: {
      BEDROCK_MODEL_ID: envModel || null,
      BEDROCK_INFERENCE_PROFILE_ARN_SET: Boolean(envArn),
    },
    effectiveTarget: target,
  });
});

// Endpoint: describe → SVG
router.post("/ai/svg", async (req, res) => {
  const { description } = req.body ?? {};
  if (!description) return res.status(400).json({ error: "description required" });


    const userPrompt = `
  Make an inline SVG that matches:

  "${description}"

  Rules:
  - Produce ONE <svg ...>...</svg> element only.
  - Include width="100%" height="100%" viewBox="0 0 128 128".
  - Add style="display: block; width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: contain; overflow: hidden;"
  - Scale all coordinates and sizes to fit within 0-128 range (divide by 4 from 512x512).
  - Use preserveAspectRatio="xMidYMid meet" to maintain aspect ratio.
  - No external assets or fonts. Simple shapes/fills/strokes OK.
  - Keep it visually clean; no scripts, no animations.
  `;

  try {
    if (!INFERENCE_PROFILE_ARN && /anthropic\.claude/.test(MODEL_ID)) {
      return res.status(400).json({
        error: "Anthropic models require an inference profile in this account/region. Set BEDROCK_INFERENCE_PROFILE_ARN or switch to a model that supports on-demand."
      });
    }
    const cmd = new ConverseCommand(makeConverseParams({
      system: [{ text: SYSTEM_IR }],
      messages: [
        { role: "user", content: [{ text: userPrompt }] },
      ],
      inferenceConfig: { maxTokens: 2000, temperature: 0 },
    }));
    
    
    const out = await bedrock.send(cmd);
    const text = out?.output?.message?.content?.[0]?.text || "";
    const svg = text.match(/<svg[\s\S]*<\/svg>/i)?.[0] ?? text;

    return res.json({ svg });
  } catch (err) {
    const msg = String(err?.message || err || "");
    if (msg.includes("No value provided for input HTTP label: modelId")) {
      return res.status(400).json({
        error: err.message,
      });
    }
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// Endpoint: describe → React code (DragResizeStatic or interactive React)
router.post("/ai/react", async (req, res) => {
  const { description } = req.body ?? {};
  if (!description) return res.status(400).json({ error: "description required" });

  if (!INFERENCE_PROFILE_ARN && /claude-3-7-sonnet/.test(MODEL_ID)) {
    return res.status(400).json({
      error: err.message,
    });
  }

  const userPrompt = `
The user wants a React component based on their description:
"${description}"

Two acceptable output modes:
1) Static canvas layout using <DragResizeStatic ...> wrappers (preferred for shapes and static content).
2) Interactive React component assigned to a variable named Generated that renders interactivity (e.g., buttons, counters). Hooks like useState are allowed.

Rules:
- Return ONLY JSX/React code; no markdown fences, no type annotations.
- Do NOT use 'export' statements or imports. Do NOT reference project-specific components like GraphicBox or DragResizeStatic.
- If interactive, assign the component to 'Generated':
  const Generated = () => { /* JSX with hooks */ };
- If static layout is desired, output plain DOM elements (div/button/svg) with inline styles only; no custom components.
- Keep code self-contained; no imports.
`;

  try {
    if (!INFERENCE_PROFILE_ARN && /anthropic\.claude/.test(MODEL_ID)) {
      return res.status(400).json({
        error: "Anthropic models require an inference profile in this account/region. Set BEDROCK_INFERENCE_PROFILE_ARN or switch to a model that supports on-demand."
      });
    }
    const cmd = new ConverseCommand(makeConverseParams({
      system: [{ text: SYSTEM_IR }],
      messages: [
        { role: "user", content: [{ text: userPrompt }] },
      ],
      inferenceConfig: { maxTokens: 2000, temperature: 0 }
    }));

    const out = await bedrock.send(cmd);
    const code = out?.output?.message?.content?.[0]?.text || "";

    return res.json({ code });
  } catch (err) {
    const msg = String(err?.message || err || "");
    if (msg.includes("No value provided for input HTTP label: modelId")) {
      return res.status(400).json({
        error: "AWS SDK version may not support inference profiles. Upgrade @aws-sdk/client-bedrock-runtime or unset BEDROCK_INFERENCE_PROFILE_ARN.",
      });
    }
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

export default router;


