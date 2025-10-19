import React from "react";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { motion, AnimatePresence } from "motion/react";
import { 
  PaintBrushIcon, 
  EyeIcon, 
  EyeSlashIcon,
  AdjustmentsHorizontalIcon,
  SwatchIcon,
  PencilIcon,
  Square3Stack3DIcon,
  PhotoIcon,
  SparklesIcon,
  ArrowsPointingOutIcon
} from "@heroicons/react/24/outline";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

/* ---------- helpers ---------- */

function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex({ r, g, b }) {
  const to2 = (n) => Math.max(0, Math.min(255, n|0)).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}
function parseCssColorToHexAlpha(input, fallbackHex = "#000000", fallbackAlpha = 1) {
  if (!input || typeof input !== "string") return { hex: fallbackHex, alpha: clamp01(fallbackAlpha) };
  const s = input.trim().toLowerCase();

  let m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (m) {
    const r = Math.round(parseFloat(m[1]));
    const g = Math.round(parseFloat(m[2]));
    const b = Math.round(parseFloat(m[3]));
    const a = m[4] != null ? clamp01(parseFloat(m[4])) : 1;
    return { hex: rgbToHex({ r, g, b }), alpha: a };
  }
  m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    const hex = m[0].length === 4 ? `#${[...m[1]].map((c) => c + c).join("")}` : m[0];
    return { hex, alpha: 1 };
  }
  return { hex: fallbackHex, alpha: clamp01(fallbackAlpha) };
}
function rgbaStringFromHexAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`;
}

/** Read once from IR, then after any update rely on local state.
 * NOTE: depsToken must be a primitive (string/number/bool) for stability.
 */
function useMirror(getInitial, write, depsToken) {
  const makeInitial = React.useCallback(() => getInitial(), [getInitial, depsToken]);
  const [value, setValue] = React.useState(makeInitial);

  React.useEffect(() => {
    setValue(makeInitial());
  }, [makeInitial]);

  // Defer external writes to commit phase to avoid cross-component update warnings
  React.useEffect(() => {
    write(value);
  }, [value, write]);

  const set = React.useCallback((next) => {
    setValue((prev) => (typeof next === "function" ? next(prev) : next));
  }, []);

  return [value, set];
}

/** Color + opacity mirror that always writes RGBA to IR.
 * NOTE: depsToken must be a primitive.
 */
function useColorWithOpacity(getInitialCssColor, writeCssColor, depsToken, fallbackHex, fallbackAlpha = 1) {
  const makeInitial = React.useCallback(() => {
    const css = getInitialCssColor();
    return parseCssColorToHexAlpha(css, fallbackHex, fallbackAlpha);
  }, [getInitialCssColor, depsToken, fallbackHex, fallbackAlpha]);

  const [{ hex, alpha }, setState] = React.useState(makeInitial);
  React.useEffect(() => { setState(makeInitial()); }, [makeInitial]);

  // Commit-phase write to IR
  React.useEffect(() => {
    writeCssColor(rgbaStringFromHexAlpha(hex, alpha));
  }, [hex, alpha, writeCssColor]);

  const setHex = React.useCallback((nextHex) => {
    setState((prev) => {
      const nx = typeof nextHex === "function" ? nextHex(prev.hex) : nextHex;
      return { hex: nx, alpha: prev.alpha };
    });
  }, []);

  const setAlpha = React.useCallback((nextAlpha) => {
    setState((prev) => {
      const a = clamp01(typeof nextAlpha === "function" ? nextAlpha(prev.alpha) : nextAlpha);
      return { hex: prev.hex, alpha: a };
    });
  }, []);

  return { hex, alpha, setHex, setAlpha };
}

/* ---------- Modern UI Components ---------- */

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/60 transition-all duration-200 group rounded-lg mx-2"
      >
        <div className="flex items-center space-x-3">
          {Icon && <Icon className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />}
          <span className="font-semibold text-gray-100 group-hover:text-white transition-colors text-sm">
            {title}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-300" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-2 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModernButton({ icon: Icon, label, onClick, variant = "secondary", isActive = false, ...props }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={onClick}
        variant={variant}
        className={`w-full flex items-center space-x-3 p-3 h-auto transition-all duration-200 ${
          isActive ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
        }`}
        {...props}
      >
        {Icon && <Icon className="h-5 w-5" />}
        <span className="text-sm font-medium">{label}</span>
      </Button>
    </motion.div>
  );
}

/* ---------- Leaf field components (hooks live here, stable order) ---------- */

function ButtonsField({ field }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {field.buttons.map((b, i) => (
        <ModernButton
          key={b.key ?? `${field.key}.btn.${i}`}
          onClick={b.onClick}
          icon={() => b.icon}
          label={b.label}
          variant="secondary"
        />
      ))}
    </div>
  );
}

function ColorField({ field }) {
  const model = useColorWithOpacity(field.get, field.set, field.depsToken, field.fallbackHex ?? "#000000", field.fallbackAlpha ?? 1);
  return (
    <div>
      <label className="text-xs text-gray-300 block mb-1">{field.label}</label>
      <input
        type="color"
        value={model.hex}
        onChange={(e) => model.setHex(e.target.value)}
        className="w-full h-8 rounded border border-gray-600 bg-gray-700"
      />
      <div className="mt-2">
        <label className="text-xs text-gray-300 block mb-1">
          Opacity: {Math.round(model.alpha * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round(model.alpha * 100)}
          onChange={(e) => model.setAlpha(parseInt(e.target.value, 10) / 100)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}

function RangeField({ field }) {
  const [val, setVal] = useMirror(field.get, field.set, field.depsToken);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-200">
          {field.label}
        </label>
        <span className="text-sm text-blue-400 font-mono">
          {field.suffix ? `${val}${field.suffix}` : val}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={field.min ?? 0}
          max={field.max ?? 100}
          step={field.step ?? 1}
          value={Number.isFinite(val) ? val : (field.fallback ?? 0)}
          onChange={(e) => {
            const raw = e.target.value;
            const v = field.float ? parseFloat(raw) : parseInt(raw, 10);
            setVal(Number.isFinite(v) ? v : (field.fallback ?? 0));
          }}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((val - (field.min ?? 0)) / ((field.max ?? 100) - (field.min ?? 0))) * 100}%, #374151 ${((val - (field.min ?? 0)) / ((field.max ?? 100) - (field.min ?? 0))) * 100}%, #374151 100%)`
          }}
        />
      </div>
    </div>
  );
}

function NumberField({ field }) {
  const [val, setVal] = useMirror(field.get, field.set, field.depsToken);
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-200 block">{field.label}</label>
      <input
        type="number"
        value={Number.isFinite(val) ? val : (field.fallback ?? 0)}
        min={field.min}
        max={field.max}
        step={field.step}
        onChange={(e) => {
          const n = field.float ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
          setVal(Number.isFinite(n) ? n : (field.fallback ?? 0));
        }}
        className="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        placeholder={field.placeholder}
      />
    </div>
  );
}

function TwoNumbersField({ field }) {
  const [a, setA] = useMirror(field.getA, field.setA, field.depsTokenA);
  const [b, setB] = useMirror(field.getB, field.setB, field.depsTokenB);
  return (
    <div>
      <label className="text-xs text-gray-300 block mb-1">{field.label}</label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={Number.isFinite(a) ? a : (field.fallbackA ?? 0)}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            setA(Number.isFinite(n) ? n : (field.fallbackA ?? 0));
          }}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          placeholder={field.placeholderA}
        />
        <input
          type="number"
          value={Number.isFinite(b) ? b : (field.fallbackB ?? 0)}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            setB(Number.isFinite(n) ? n : (field.fallbackB ?? 0));
          }}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          placeholder={field.placeholderB}
        />
      </div>
    </div>
  );
}

function SelectField({ field }) {
  const [val, setVal] = useMirror(field.get, field.set, field.depsToken);
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-200 block">{field.label}</label>
      <div className="grid grid-cols-2 gap-2">
        {field.options.map((opt) => (
          <motion.button
            key={opt.value}
            onClick={() => setVal(opt.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
              val === opt.value 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
            }`}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function TextField({ field }) {
  const [val, setVal] = useMirror(field.get, field.set, field.depsToken);
  return (
    <div>
      <label className="text-xs text-gray-300 block mb-1">{field.label}</label>
      <textarea
        value={String(val ?? "")}
        onChange={(e) => setVal(e.target.value)}
        rows={field.rows ?? 3}
        className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white resize-y"
        placeholder={field.placeholder}
      />
    </div>
  );
}

function InfoField({ field }) {
  const content = field.get(); // pure read
  return (
    <div className="mt-2 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
      <div className="text-xs text-blue-300 font-medium mb-1">{field.title}</div>
      <div className="text-xs text-blue-200">{content}</div>
      {field.hint && <div className="text-xs text-gray-400 mt-1">{field.hint}</div>}
    </div>
  );
}

/* ---------- Dispatcher (NO HOOKS HERE) ---------- */

const FIELD_COMPONENTS = {
  buttons: ButtonsField,
  color: ColorField,
  range: RangeField,
  number: NumberField,
  twonumbers: TwoNumbersField,
  select: SelectField,
  text: TextField,
  info: InfoField,
};

function FieldRenderer({ field }) {
  const Comp = FIELD_COMPONENTS[field.type] || (() => null);
  return <Comp field={field} />;
}

/* ---------- Schema with stable keys + primitive depsTokens ---------- */

function buildSchema({ ir, selected, onAddElement }) {
  const getTextChild = (node) => (node?.children?.[0] ?? null);
  const selectedText = getTextChild(selected);
  const hasText = !!selectedText;

  // derive primitive tokens for stability
  const irToken = ir?.get?.("id") ?? "ir";
  const selToken = selected?.get?.("elementId") ?? null;
  const selTextToken = selectedText?.get?.("elementId") ?? null;

  const schema = [

    {
      key: "sec.canvas",
      title: "Canvas Settings",
      fields: [
        {
          key: "canvas.bg",
          type: "color",
          label: "Background Color",
          get: () => ir?.readStyle("canvasBackground", "#ffffff"),
          set: (css) => ir?.writeStyle("canvasBackground", css),
          depsToken: irToken,
          fallbackHex: "#ffffff",
          fallbackAlpha: 1,
        },
        {
          key: "canvas.size",
          type: "twonumbers",
          label: "Canvas Size",
          getA: () => (ir?.get?.("size")?.w ?? 1200),
          setA: (w) => {
            const cur = ir?.get?.("size") ?? { w: 1200, h: 800 };
            ir?.set?.("size", { ...cur, w });
          },
          depsTokenA: irToken,
          fallbackA: 1200,
          placeholderA: "Width",

          getB: () => (ir?.get?.("size")?.h ?? 800),
          setB: (h) => {
            const cur = ir?.get?.("size") ?? { w: 1200, h: 800 };
            ir?.set?.("size", { ...cur, h });
          },
          depsTokenB: irToken,
          fallbackB: 800,
          placeholderB: "Height",
        },
      ],
    },

    { key: "sep.2", separator: true },

    hasText && {
      key: "sec.text",
      title: "Text",
      fields: [
        {
          key: `text.align.${selTextToken ?? "none"}`,
          type: "select",
          label: "Text Alignment",
          options: [
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ],
          get: () => selectedText.readStyle("textAlign", "center"),
          set: (v) => selectedText.writeStyle("textAlign", v),
          depsToken: selTextToken,
        },
        {
          key: `text.fontSize.${selTextToken ?? "none"}`,
          type: "range",
          label: "Font Size",
          min: 8, max: 48, step: 2,
          get: () => parseInt(selectedText.readStyle("fontSize", 16), 10),
          set: (v) => selectedText.writeStyle("fontSize", v),
          depsToken: selTextToken,
          suffix: "px",
        },
        {
          key: `text.fontFamily.${selTextToken ?? "none"}`,
          type: "select",
          label: "Font Family",
          options: [
            { value: "Arial, sans-serif", label: "Arial" },
            { value: "Helvetica, sans-serif", label: "Helvetica" },
            { value: "Georgia, serif", label: "Georgia" },
            { value: "Times New Roman, serif", label: "Times New Roman" },
            { value: "Courier New, monospace", label: "Courier New" },
            { value: "Verdana, sans-serif", label: "Verdana" },
            { value: "Impact, sans-serif", label: "Impact" },
            { value: "Comic Sans MS, cursive", label: "Comic Sans" },
            { value: "Trebuchet MS, sans-serif", label: "Trebuchet MS" },
            { value: "Impact, 'Arial Black', 'Helvetica Neue Condensed Bold', Anton, Oswald, sans-serif", label: "Impact" },
          ],
          get: () => selectedText.readStyle("fontFamily", "Arial, sans-serif"),
          set: (v) => selectedText.writeStyle("fontFamily", v),
          depsToken: selTextToken,
        },
        {
          key: `text.color.${selTextToken ?? "none"}`,
          type: "color",
          label: "Text Color",
          get: () => selectedText.readStyle("color", "#e5e7eb"),
          set: (css) => selectedText.writeStyle("color", css),
          depsToken: selTextToken,
          fallbackHex: "#e5e7eb",
          fallbackAlpha: 1,
        },
        {
          key: `text.weight.${selTextToken ?? "none"}`,
          type: "select",
          label: "Font Weight",
          options: [
            { value: "300", label: "Light" },
            { value: "400", label: "Normal" },
            { value: "500", label: "Medium" },
            { value: "700", label: "Bold" },
          ],
          get: () => selectedText.readStyle("fontWeight", "400"),
          set: (v) => selectedText.writeStyle("fontWeight", v),
          depsToken: selTextToken,
        },
        {
          key: `text.lineHeight.${selTextToken ?? "none"}`,
          type: "range",
          label: "Line Height",
          min: 0.8, max: 2.0, step: 0.05, float: true,
          get: () => parseFloat(selectedText.readStyle("lineHeight", 1.2)),
          set: (v) => selectedText.writeStyle("lineHeight", v),
          depsToken: selTextToken,
        },
      ],
    },

    selected && { key: "sep.3", separator: true },

    selected && {
      key: "sec.appearance",
      title: "Appearance",
      fields: [
        // Line-specific controls
        selected?.constructor?.name === 'IRLine' && {
          key: `line.curved.${selToken ?? "none"}`,
          type: "select",
          label: "Line Type",
          options: [
            { value: false, label: "Straight" },
            { value: true, label: "Curved (Bezier)" },
          ],
          get: () => !!selected.get?.("curved"),
          set: (v) => {
            const on = v === true || v === "true";
            selected.set?.("curved", on);
            if (on) {
              const parts = parseInt(selected.get?.("curvePartitions") ?? 2, 10);
              if (parts === 1) {
                const s = selected.get?.("start") ?? { x: 0, y: 0.5 };
                const e = selected.get?.("end") ?? { x: 1, y: 0.5 };
                const mid = { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 };
                selected.set?.("cp1", mid);
              }
            }
          },
          depsToken: selToken,
        },
        selected?.constructor?.name === 'IRLine' && {
          key: `line.partitions.${selToken ?? "none"}`,
          type: "select",
          label: "Curve Partitions",
          options: [
            { value: 1, label: "Single (Quadratic)" },
            { value: 2, label: "Double (Cubic)" },
          ],
          get: () => parseInt(selected.get?.("curvePartitions") ?? 2, 10),
          set: (v) => {
            const parts = parseInt(v, 10) === 1 ? 1 : 2;
            selected.set?.("curvePartitions", parts);
            if (parts === 1) {
              const s = selected.get?.("start") ?? { x: 0, y: 0.5 };
              const e = selected.get?.("end") ?? { x: 1, y: 0.5 };
              const mid = { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 };
              selected.set?.("cp1", mid);
            } else {
              // restore default control placement for cubic
              const s = selected.get?.("start") ?? { x: 0, y: 0.5 };
              const e = selected.get?.("end") ?? { x: 1, y: 0.5 };
              const cp1 = { x: s.x + (e.x - s.x) * (1/3), y: s.y + (e.y - s.y) * (1/3) };
              const cp2 = { x: s.x + (e.x - s.x) * (2/3), y: s.y + (e.y - s.y) * (2/3) };
              selected.set?.("cp1", cp1);
              selected.set?.("cp2", cp2);
            }
          },
          depsToken: selToken,
        },
        selected?.constructor?.name === 'IRLine' && {
          key: `line.center.${selToken ?? "none"}`,
          type: "buttons",
          buttons: [
            {
              key: `line.center.btn.${selToken ?? "none"}`,
              label: "Center Control (Quadratic)",
              icon: null,
              onClick: () => {
                const s = selected.get?.("start") ?? { x: 0, y: 0.5 };
                const e = selected.get?.("end") ?? { x: 1, y: 0.5 };
                const mid = { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 };
                selected.set?.("cp1", mid);
                selected.set?.("curvePartitions", 1);
                selected.set?.("curved", true);
              },
            },
          ],
        },
        selected?.constructor?.name === 'IRLine' && {
          key: `line.stroke.${selToken ?? "none"}`,
          type: "color",
          label: "Stroke Color",
          get: () => selected.readStyle("stroke", "#111827"),
          set: (css) => selected.writeStyle("stroke", css),
          depsToken: selToken,
          fallbackHex: "#111827",
          fallbackAlpha: 1,
        },
        selected?.constructor?.name === 'IRLine' && {
          key: `line.width.${selToken ?? "none"}`,
          type: "range",
          label: "Stroke Width",
          min: 1, max: 20, step: 1,
          get: () => parseInt(selected.readStyle("strokeWidth", 2), 10) || 2,
          set: (v) => selected.writeStyle("strokeWidth", v),
          depsToken: selToken,
          suffix: "px",
        },
        selected?.constructor?.name === 'IRLine' && {
          key: `line.opacity.${selToken ?? "none"}`,
          type: "range",
          label: "Stroke Opacity",
          min: 0, max: 100, step: 1,
          get: () => Math.round(parseFloat(selected.readStyle("strokeOpacity", 1)) * 100),
          set: (pct) => selected.writeStyle("strokeOpacity", (pct / 100)),
          depsToken: selToken,
          suffix: "%",
        },
        {
          key: `appearance.borderWidth.${selToken ?? "none"}`,
          type: "range",
          label: "Border Size",
          min: 0, max: 10, step: 1,
          get: () => {
            const raw = selected.readStyle("borderWidth", "0px");
            const s = (raw ?? "0").toString();
            const n = parseInt(s, 10);
            return Number.isFinite(n) ? n : 0;
          },
          set: (v) => selected.writeStyle("borderWidth", `${v}px`),
          depsToken: selToken,
          suffix: "px",
        },
        {
          key: `appearance.borderStyle.${selToken ?? "none"}`,
          type: "select",
          label: "Border Style",
          options: [
            { value: "none",  label: "None"  },
            { value: "solid", label: "Solid" },
            { value: "dashed",label: "Dashed"},
            { value: "dotted",label: "Dotted"},
          ],
          get: () => selected.readStyle("borderStyle", "solid"),
          set: (v) => selected.writeStyle("borderStyle", v),
          depsToken: selToken,
        },
        selected?.constructor?.name === 'IRRect' && {
          key: `appearance.cornerRadius.${selToken ?? "none"}`,
          type: "range",
          label: "Corner Radius",
          min: 0, max: 64, step: 1,
          get: () => parseInt(selected.readStyle("borderRadius", "0px"), 10) || 0,
          set: (v) => selected.writeStyle("borderRadius", `${v}px`),
          depsToken: selToken,
          suffix: "px",
        },
        {
          key: `appearance.borderColor.${selToken ?? "none"}`,
          type: "color",
          label: "Border Color",
          get: () => selected.readStyle("borderColor", "#3b82f6"),
          set: (css) => selected.writeStyle("borderColor", css),
          depsToken: selToken,
          fallbackHex: "#3b82f6",
          fallbackAlpha: 1,
        },
        {
          key: `appearance.fill.${selToken ?? "none"}`,
          type: "color",
          label: "Fill Color",
          get: () => selected.readStyle("backgroundColor", "#000000"),
          set: (css) => selected.writeStyle("backgroundColor", css),
          depsToken: selToken,
          fallbackHex: "#000000",
          fallbackAlpha: 1,
        },
        {
          key: `appearance.opacity.${selToken ?? "none"}`,
          type: "range",
          label: "Element Opacity",
          min: 0, max: 100, step: 1,
          get: () => Math.round(parseFloat(selected.readStyle("opacity", 1)) * 100),
          set: (pct) => selected.writeStyle("opacity", (pct / 100)),
          depsToken: selToken,
          suffix: "%", 
        },
      ].filter(Boolean),
    },

    selected && { key: "sep.4", separator: true },

    selected && {
      key: "sec.shadow",
      title: "Shadow",
      fields: [
        {
          key: `shadow.blur.${selToken ?? "none"}`,
          type: "range",
          label: "Shadow Blur",
          min: 0, max: 100, step: 1,
          get: () => parseInt(selected.readStyle("boxShadowBlur", "0"), 10) || 0,
          set: (v) => {
            const x = parseInt(selected.readStyle("boxShadowOffsetX", "0"), 10) || 0;
            const y = parseInt(selected.readStyle("boxShadowOffsetY", "0"), 10) || 0;
            const color = selected.readStyle("boxShadowColor", "rgba(0,0,0,0.3)");
            selected.writeStyle("boxShadow", `${x}px ${y}px ${v}px ${color}`);
            selected.writeStyle("boxShadowBlur", v);
          },
          depsToken: selToken,
          suffix: "px",
        },
        {
          key: `shadow.offset.${selToken ?? "none"}`,
          type: "twonumbers",
          label: "Shadow Offset (X/Y)",
          getA: () => parseInt(selected.readStyle("boxShadowOffsetX", "0"), 10) || 0,
          setA: (vx) => {
            const blur  = parseInt(selected.readStyle("boxShadowBlur", "0"), 10) || 0;
            const y     = parseInt(selected.readStyle("boxShadowOffsetY", "0"), 10) || 0;
            const color = selected.readStyle("boxShadowColor", "rgba(0,0,0,0.3)");
            selected.writeStyle("boxShadow", `${vx}px ${y}px ${blur}px ${color}`);
            selected.writeStyle("boxShadowOffsetX", vx);
          },
          depsTokenA: selToken,
          getB: () => parseInt(selected.readStyle("boxShadowOffsetY", "0"), 10) || 0,
          setB: (vy) => {
            const blur  = parseInt(selected.readStyle("boxShadowBlur", "0"), 10) || 0;
            const x     = parseInt(selected.readStyle("boxShadowOffsetX", "0"), 10) || 0;
            const color = selected.readStyle("boxShadowColor", "rgba(0,0,0,0.3)");
            selected.writeStyle("boxShadow", `${x}px ${vy}px ${blur}px ${color}`);
            selected.writeStyle("boxShadowOffsetY", vy);
          },
          depsTokenB: selToken,
          fallbackA: 0,
          fallbackB: 0,
        },
        {
          key: `shadow.color.${selToken ?? "none"}`,
          type: "color",
          label: "Shadow Color",
          get: () => selected.readStyle("boxShadowColor", "rgba(0,0,0,0.3)"),
          set: (css) => {
            const blur = parseInt(selected.readStyle("boxShadowBlur", "0"), 10) || 0;
            const x    = parseInt(selected.readStyle("boxShadowOffsetX", "0"), 10) || 0;
            const y    = parseInt(selected.readStyle("boxShadowOffsetY", "0"), 10) || 0;
            selected.writeStyle("boxShadow", `${x}px ${y}px ${blur}px ${css}`);
            selected.writeStyle("boxShadowColor", css);
          },
          depsToken: selToken,
          fallbackHex: "#000000",
          fallbackAlpha: 0.3,
        },
      ],
    },
  ].filter(Boolean);

  return schema;
}

/* ---------- Sidebar (uses ONLY stable keys) ---------- */

export default function Sidebar({
  sidebarWidth,
  selected,
  ir,
  onAddElement,
}) {
  const schema = React.useMemo(() => buildSchema({ ir, selected, onAddElement }), [ir, selected, onAddElement]);

  // Add custom styles for the slider
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .slider::-webkit-slider-thumb {
        appearance: none;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .slider::-moz-range-thumb {
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <motion.div
      initial={{ x: -sidebarWidth }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700/30 flex-shrink-0 h-full overflow-y-auto backdrop-blur-sm shadow-2xl"
      style={{ width: `${sidebarWidth}px`, maxHeight: "100vh" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/30 px-4 py-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-blue-400" />
          <span>Properties</span>
        </h2>
      </div>

      {/* Modern Content */}
      <div className="p-4 pb-32 space-y-2">
        {schema.map((section, index) => {
          const hasFields = section.fields && section.fields.length > 0;
          const hasContent = section.title || hasFields;
          if (!hasContent) return null;
          
          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {section.separator && (
                <div className="my-6">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent" />
                </div>
              )}
              
              {section.title && hasFields && (
                <CollapsibleSection
                  title={section.title}
                  icon={getSectionIcon(section.key)}
                  defaultOpen={index < 2}
                >
                  <div className="space-y-4">
                    {(section.fields || [])
                      .filter(Boolean)
                      .map((field, i) => (
                        <FieldRenderer
                          key={field.key ?? `${section.key}.${field.type ?? 'unknown'}.${i}`}
                          field={field}
                        />
                      ))}
                  </div>
                </CollapsibleSection>
              )}
              
              {!section.title && hasFields && (
                <div className="space-y-4">
                  {(section.fields || [])
                    .filter(Boolean)
                    .map((field, i) => (
                      <FieldRenderer
                        key={field.key ?? `${section.key}.${field.type ?? 'unknown'}.${i}`}
                        field={field}
                      />
                    ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Helper function to get appropriate icons for sections
function getSectionIcon(sectionKey) {
  const iconMap = {
    'sec.canvas': Square3Stack3DIcon,
    'sec.rect': AdjustmentsHorizontalIcon,
    'sec.text': PencilIcon,
    'sec.image': PhotoIcon,
    'sec.ai': SparklesIcon,
    'sec.visibility': EyeIcon,
    'sec.transform': ArrowsPointingOutIcon,
    'sec.style': PaintBrushIcon,
    'sec.color': SwatchIcon,
  };
  return iconMap[sectionKey] || AdjustmentsHorizontalIcon;
}
