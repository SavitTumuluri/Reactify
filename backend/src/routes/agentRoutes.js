// P.S. THIS IS NO WHERE NEAR A SOLUTION FOR PRODUCTION LOL, JUST DONT HAVE TIME OR SKILL TO GET THIS WORK HAHA

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
You are an intelligent AI assistant for a canvas editor. You can help users create and modify visual designs.

You have two modes:
1. CANVAS_EDITING: When the user wants to create, modify, or arrange visual elements
2. CONVERSATIONAL: When the user asks questions, needs help, or makes non-canvas requests

For CANVAS_EDITING requests, you should:
- CAREFULLY analyze the current IR (intermediate representation) of the canvas
- Make MINIMAL changes - only add/modify what the user specifically requested
- PRESERVE ALL existing elements unless explicitly asked to delete/clear
- NEVER replace the entire canvas unless user says "clear" or "reset"
- When adding elements, place them alongside existing elements, not replace them
- Return the updated IR JSON with existing elements intact

For CONVERSATIONAL requests, you should:
- Provide helpful, friendly responses
- Explain how to use the canvas editor
- Answer questions about the application
- NOT modify the IR

Input: JSON representing the current IR, produced by Save(ir) with this schema:
- { "name": string, "_data": object, "children": Save[] }
- "name" must be one of: IRCanvasContainer, IRRect, IRCircle, IRTriangle, IRStar, IRLine, IRText, IRAIComponent.
- Positions and sizes are relative in [0,1] and live in _data.posRel and _data.sizeRel.
- Canvas background color is in root _data.styles.canvasBackground.
- Elements should preserve their existing _data.elementId values where present.

Color and styles normalization rules:
- Filled shapes (IRRect, IRCircle, IRTriangle, IRStar): set color via _data.styles.backgroundColor
- Lines (IRLine): set _data.styles.stroke (color string), _data.styles.strokeWidth (number)
- Text (IRText): set _data.styles.color for the text color

CRITICAL RULES FOR CANVAS EDITING:
1. ALWAYS preserve the existing IR structure and all existing elements
2. When adding new elements, append them to the existing children array
3. NEVER replace the entire children array unless user explicitly says "clear" or "reset"
4. Maintain the same canvas container structure with existing styles
5. Only modify what the user specifically requested
6. Keep existing element IDs and properties intact
7. If you are unsure, ALWAYS preserve existing elements and only add new ones
8. NEVER delete or remove existing elements unless the user explicitly asks to delete/remove/clear

Response format (MUST be valid JSON):
- If it's a CANVAS_EDITING request: Return JSON with {"action": "modify_ir", "ir": updatedIR, "message": "helpful description of what was done"}
- If it's a CONVERSATIONAL request: Return JSON with {"action": "conversation", "message": "your helpful response"}

IMPORTANT: 
- Always return valid JSON format
- Do not include any text before or after the JSON
- Escape any special characters in strings
- Keep messages concise and helpful

Examples of CONVERSATIONAL requests (don't modify IR):
- "What does this application do?"
- "How do I add a rectangle?"
- "What colors are available?"
- "Help me understand the interface"
- "What can you do?"
- "How do I save my work?"

Examples of CANVAS_EDITING requests (modify IR):
- "Add a blue rectangle in the center"
- "Make the background red"
- "Create a star shape"
- "Move the circle to the left"
- "Delete the rectangle"
- "Add text saying 'Hello World'"

Example responses:
For "What does this application do?" → {"action": "conversation", "message": "This is a visual canvas editor where you can create designs by adding shapes, text, and other elements. You can ask me to add rectangles, circles, stars, text, or change colors and backgrounds."}

For "Add a blue rectangle" → {"action": "modify_ir", "ir": {...}, "message": "I've added a blue rectangle to your canvas."}

EXAMPLE: If current IR has children: [existingRect1, existingRect2] and user says "add a circle":
- CORRECT: Return IR with children: [existingRect1, existingRect2, newCircle]
- WRONG: Return IR with children: [newCircle] (this deletes existing elements)
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
    const userPrompt = `Instruction: ${description}\nCurrent IR (JSON):\n${stateJson}

IMPORTANT: The current IR contains existing elements. You MUST preserve all existing elements and only add/modify what the user specifically requested. Do NOT replace the entire children array.`;

    const cmd = new ConverseCommand(makeConverseParams({
      system: [{ text: SYSTEM_FULL_IR }],
      messages: [ { role: "user", content: [{ text: userPrompt }] } ],
      inferenceConfig: { maxTokens: 6000, temperature: 0 }
    }));

    const out = await bedrock.send(cmd);
    const text = out?.output?.message?.content?.[0]?.text || "";
    
    // Try to parse the response as JSON
    let response;
    try {
      // Clean the text first to handle control characters
      const cleanedText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      response = JSON.parse(cleanedText);
    } catch (parseError) {
      console.log("JSON parse error:", parseError.message);
      console.log("Raw response:", text);
      
      // Try to extract JSON from the text using a more robust approach
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const cleanedJson = jsonMatch[0].replace(/[\x00-\x1F\x7F-\x9F]/g, '');
          response = JSON.parse(cleanedJson);
        } catch (jsonError) {
          console.log("JSON extraction error:", jsonError.message);
          // Fallback: treat as conversational response
          response = {
            action: "conversation",
            message: text.trim()
          };
        }
      } else {
        // Fallback: treat as conversational response
        response = {
          action: "conversation",
          message: text.trim()
        };
      }
    }
    
    // Validate response format
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format");
    }
    
    // Handle different response types
    if (response.action === "conversation") {
      return res.json({ 
        action: "conversation", 
        message: response.message || "I'm here to help! How can I assist you with your canvas?" 
      });
    } else if (response.action === "modify_ir" && response.ir) {
      // Validate that existing elements are preserved
      const originalChildrenCount = state?.children?.length || 0;
      const newChildrenCount = response.ir?.children?.length || 0;
      
      // Log for debugging
      console.log(`IR modification: Original ${originalChildrenCount} elements, New ${newChildrenCount} elements`);
      
      // Check if user explicitly asked to delete/clear
      const isDeleteRequest = description.toLowerCase().includes('delete') || 
                             description.toLowerCase().includes('remove') || 
                             description.toLowerCase().includes('clear') || 
                             description.toLowerCase().includes('reset');
      
      // If we're not deleting and have fewer elements, try to fix it
      if (!isDeleteRequest && newChildrenCount < originalChildrenCount) {
        console.log("AI tried to delete elements without explicit request, attempting to fix");
        
        // Try to merge existing elements with new ones
        const originalChildren = state?.children || [];
        const newChildren = response.ir?.children || [];
        
        // Create a corrected IR that preserves existing elements
        const correctedIR = {
          ...response.ir,
          children: [...originalChildren, ...newChildren]
        };
        
        return res.json({ 
          action: "modify_ir", 
          ir: correctedIR, 
          message: "I've added the requested elements while preserving your existing canvas content." 
        });
      }
      
      return res.json({ 
        action: "modify_ir", 
        ir: response.ir, 
        message: response.message || "I've updated your canvas as requested." 
      });
    } else {
      // Fallback: try to treat as IR modification
      return res.json({ 
        action: "modify_ir", 
        ir: response, 
        message: "I've updated your canvas." 
      });
    }
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

export default router;


