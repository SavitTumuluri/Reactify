import express from "express";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const router = express.Router();

const REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-2";
const MODEL_ID = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20240620-v1:0";
const INFERENCE_PROFILE_ARN = process.env.BEDROCK_INFERENCE_PROFILE_ARN || "";
const bedrock = new BedrockRuntimeClient({ region: REGION });

function makeConverseParams(extras) {
  const arn = (process.env.BEDROCK_INFERENCE_PROFILE_ARN || "").trim();
  const id = (process.env.BEDROCK_MODEL_ID || MODEL_ID || "").trim();
  if (arn) return { modelId: id, inferenceProfileArn: arn, ...extras };
  if (id) return { modelId: id, ...extras };
  throw new Error("No modelId or inferenceProfileArn configured for ConverseCommand");
}

const SYSTEM_PLAN = `
You are a planning agent for a canvas editor. The editor uses an IR (intermediate representation) with nodes and relative layout.

Return ONLY valid compact JSON with this shape:
{
  "actions": [
    {"op": "add|update|move|delete", "type": "rectangle|circle|triangle|star|line|text|aiComponent", "id?": "string", "posRel?": {"x":0..1, "y":0..1}, "sizeRel?": {"w":0..1, "h":0..1}, "angle?": number, "styles?": {"...": "..."}, "text?": "..."}
  ],
  "meta": {"intent": "short_label"}
}

Rules:
- DEFAULT IS NON-DESTRUCTIVE. Keep all existing elements unless the user explicitly asks to replace/delete/clear/reset.
- For any update/move/delete of an existing element you MUST include its "id" from the provided state. If you cannot identify an id, prefer an "add" action instead of modifying.
- Prefer shapes (rectangle, circle, triangle, star, line, text) over images or aiComponent when possible.
- Use relative positions and sizes in [0,1]. Keep inside the canvas (0<=x<=1-w, 0<=y<=1-h).
- For lines, default to a horizontal line within a small height box if unsure.
- Keep output minimal but complete. No markdown, no commentary.
 - Use styles keys that match CSS-like fields: backgroundColor, borderWidth, borderStyle, borderColor, boxShadow, text color as "color", fontSize (number), borderRadius. For stars/triangles use clipPath when needed.
 - When modifying an existing element, include its "id" from the provided state. If you add a new element, you do not need to supply id.
 - If user requests color changes (e.g., "make the rectangle yellow"), emit an update with styles.backgroundColor for the target by id or by choosing an existing element of the requested type and position that best matches.
 - If the request mentions relative positioning (e.g., "move the circle above the rectangle"), compute reasonable posRel values based on the referenced elements' current sizeRel/posRel in the provided state.
 - To change the canvas background, emit an action like: {"op":"update","type":"canvas","styles":{"canvasBackground":"#RRGGBB"}}. backgroundColor is also accepted. Do NOT emulate background by adding a large rectangle/circle.
 - If the user explicitly says "clear", "reset canvas", or "start over", you may emit a single action {"op":"clear"} to remove all elements.
`;

// System prompt for full-IR rewriting
const SYSTEM_FULL_IR = `
You are an IR rewriter for a canvas editor.

Input: JSON representing the current IR, produced by Save(ir) with this schema:
- { "name": string, "_data": object, "children": Save[] }
- "name" must be one of: IRCanvasContainer, IRRect, IRCircle, IRTriangle, IRStar, IRLine, IRText, IRAIComponent.
- Positions and sizes are relative in [0,1] and live in _data.posRel and _data.sizeRel.
- Canvas background color is in root _data.styles.canvasBackground.
- Elements should preserve their existing _data.elementId values where present.

Color and styles normalization rules (follow these to ensure correct rendering):
- Filled shapes (IRRect, IRCircle, IRTriangle, IRStar): set color via _data.styles.backgroundColor (NOT stroke). If you only have a single color, use backgroundColor. You may also include border properties.
- Lines (IRLine): set _data.styles.stroke (color string), _data.styles.strokeWidth (number), and optionally _data.styles.strokeOpacity (0..1). Do NOT rely on backgroundColor for lines.
- Text (IRText): set _data.styles.color for the text color.

Rotation and lines:
- All placeable elements may include _data.angle in degrees.
- IRLine specifics:
  - Preferred styles in _data.styles: stroke (color string), strokeWidth (number), strokeOpacity (0..1).
  - Direction can be set either by _data.angle (e.g., 90 for vertical) OR by endpoints:
    - _data.start: {x:0..1, y:0..1} and _data.end: {x:0..1, y:0..1} within the line's box.
    - Example vertical without angle: start {x:0.5,y:0}, end {x:0.5,y:1}.

Task: Modify the IR minimally to satisfy the user's instruction. DEFAULT IS NON-DESTRUCTIVE; keep existing elements unless the user explicitly asks to replace/delete/clear.

Output: ONLY the updated IR JSON in the same Save format. No markdown, no code fences, no commentary.
`;

// Utility: clamp between 0 and 1
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Basic keyword helpers
function includesAny(text, words) {
  const t = (text || "").toLowerCase();
  return words.some((w) => t.includes(w.toLowerCase()));
}

// Local deterministic planner for well-known requests
function planAmericanFlag() {
  // Dimensions are relative to canvas
  const marginX = 0.05;
  const marginY = 0.05;
  const contentW = 0.90;
  const contentH = 0.60; // keep top portion clean
  const stripeCount = 13;
  const stripeH = contentH / stripeCount;

  const red = "#B22234";
  const white = "#FFFFFF";
  const blue = "#3C3B6E";

  /** @type {any[]} */
  const actions = [];

  // Stripes: start with red at top, alternating
  for (let i = 0; i < stripeCount; i++) {
    const isRed = i % 2 === 0;
    actions.push({
      op: "add",
      type: "rectangle",
      posRel: { x: marginX, y: marginY + i * stripeH },
      sizeRel: { w: contentW, h: stripeH },
      styles: { backgroundColor: isRed ? red : white, borderWidth: "0px" },
    });
  }

  // Union (canton)
  const cantonH = stripeH * 7; // height of 7 stripes
  const cantonW = contentW * 0.4; // typical proportion
  actions.push({
    op: "add",
    type: "rectangle",
    id: "us-canton",
    posRel: { x: marginX, y: marginY },
    sizeRel: { w: cantonW, h: cantonH },
    styles: { backgroundColor: blue, borderWidth: "0px" },
  });

  // Stars: 9 alternating rows (6 + 5 + 6 + 5 ...), total 50
  const starRows = 9;
  const starsInRow = (row) => (row % 2 === 0 ? 6 : 5); // start with 6
  const padX = cantonW * 0.06;
  const padY = cantonH * 0.08;
  const starAreaW = cantonW - padX * 2;
  const starAreaH = cantonH - padY * 2;
  const rowGap = starAreaH / (starRows - 1);

  // approximate star size
  const starRelSize = Math.min(starAreaW / (6 * 2.0), rowGap * 0.6);
  const starW = clamp01(starRelSize);
  const starH = clamp01(starRelSize);

  for (let r = 0; r < starRows; r++) {
    const n = starsInRow(r);
    const offsetX = r % 2 === 0 ? 0 : starAreaW / (n + 1); // 6-star rows start aligned, 5-star rows centered
    for (let c = 0; c < n; c++) {
      const x = marginX + padX + (c + 0.5) * (starAreaW / n) + (r % 2 === 0 ? 0 : 0);
      const y = marginY + padY + r * rowGap;
      actions.push({
        op: "add",
        type: "star",
        posRel: {
          x: clamp01(x - starW / 2),
          y: clamp01(y - starH / 2),
        },
        sizeRel: { w: starW, h: starH },
        styles: { backgroundColor: "#FFFFFF", borderWidth: "0px" },
      });
    }
  }

  return { actions, meta: { intent: "american_flag" } };
}

function planSimpleShape(description) {
  const t = (description || "").toLowerCase();

  const colorMap = [
    ["dark red", "#b91c1c"],
    ["navy", "#1e3a8a"],
    ["dark blue", "#1d4ed8"],
    ["light blue", "#60a5fa"],
    ["teal", "#0d9488"],
    ["cyan", "#06b6d4"],
    ["orange", "#f97316"],
    ["pink", "#ec4899"],
    ["red", "#ef4444"],
    ["blue", "#3b82f6"],
    ["green", "#22c55e"],
    ["yellow", "#f59e0b"],
    ["purple", "#a855f7"],
    ["black", "#111827"],
    ["white", "#ffffff"],
    ["grey", "#9ca3af"],
    ["gray", "#9ca3af"],
  ];
  const color = (colorMap.find(([k]) => t.includes(k))?.[1]) || "#ffffff";

  // Background/canvas intent — return canvas update
  if (includesAny(t, ["background", "canvas", "bg", "backdrop"])) {
    return {
      actions: [{ op: "update", type: "canvas", styles: { canvasBackground: color } }],
      meta: { intent: "canvas_background" },
    };
  }

  const pos = { x: 0.08, y: 0.08 };
  const size = { w: 0.35, h: 0.22 };

  const actions = [];
  if (includesAny(t, ["clear", "reset canvas", "start over"])) {
    return { actions: [{ op: "clear" }], meta: { intent: "clear" } };
  }
  if (includesAny(t, ["rectangle", "box", "square"])) {
    actions.push({ op: "add", type: "rectangle", posRel: pos, sizeRel: size, styles: { backgroundColor: color } });
  } else if (includesAny(t, ["circle", "ellipse", "round"])) {
    actions.push({ op: "add", type: "circle", posRel: pos, sizeRel: size, styles: { backgroundColor: color } });
  } else if (includesAny(t, ["triangle"])) {
    actions.push({ op: "add", type: "triangle", posRel: pos, sizeRel: size, styles: { backgroundColor: color } });
  } else if (includesAny(t, ["star"])) {
    actions.push({ op: "add", type: "star", posRel: pos, sizeRel: size, styles: { backgroundColor: color } });
  } else if (includesAny(t, ["line"])) {
    actions.push({ op: "add", type: "line", posRel: { x: 0.1, y: 0.1 }, sizeRel: { w: 0.4, h: 0.02 }, styles: { backgroundColor: color } });
  } else if (includesAny(t, ["text"])) {
    const textMatch = description.match(/"([^"]+)"|'([^']+)'/);
    const text = textMatch?.[1] || textMatch?.[2] || "Your text";
    actions.push({ op: "add", type: "text", posRel: pos, sizeRel: size, text, styles: { color: "#111827", fontSize: 24 } });
  }

  return actions.length ? { actions, meta: { intent: "simple_shape" } } : null;
}

// Deprecated: action planner endpoint retained for compatibility (returns a simple message)
router.post("/ai/agent/plan", async (_req, res) => {
  res.status(410).json({ error: "Agent planner deprecated. Use /api/ai/agent/rewrite with full IR." });
});

// New endpoint: full IR rewrite. Sends current IR and instruction; returns updated IR JSON.
router.post("/ai/agent/rewrite", async (req, res) => {
  try {
    const description = (req.body?.description || "").trim();
    const state = req.body?.state || null; // Save(ir)
    if (!description) return res.status(400).json({ error: "description required" });
    if (!state) return res.status(400).json({ error: "state required (Save(ir))" });

    if (!INFERENCE_PROFILE_ARN && /anthropic\.claude/.test(MODEL_ID)) {
      return res.status(400).json({
        error: "Anthropic models require an inference profile in this account/region. Set BEDROCK_INFERENCE_PROFILE_ARN or choose a supported model.",
      });
    }

    const stateJson = JSON.stringify(state).slice(0, 100000); // generous cap
    const userPrompt = `Instruction: ${description}\nCurrent IR (JSON):\n${stateJson}`;

    const cmd = new ConverseCommand(makeConverseParams({
      system: [{ text: SYSTEM_FULL_IR }],
      messages: [ { role: "user", content: [{ text: userPrompt }] } ],
      inferenceConfig: { maxTokens: 6000, temperature: 0 }
    }));

    const out = await bedrock.send(cmd);
    const text = out?.output?.message?.content?.[0]?.text || "";
    const jsonText = (() => {
      try { JSON.parse(text); return text; } catch (_) {}
      const match = text.match(/\{[\s\S]*\}$/);
      return match ? match[0] : text;
    })();
    const updated = JSON.parse(jsonText);
    if (!updated || typeof updated !== "object") throw new Error("invalid IR");
    return res.json({ ir: updated });
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

export default router;


