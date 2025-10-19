import { IRView } from "../core/IR";

export class IRLine extends IRView {
  constructor(parent, init = {}) {
    const defaults = {
      posRel: { x: 0.2, y: 0.2 },
      sizeRel: { w: 0.4, h: 0.1 },
      angle: 0,
      // line specific
      start: { x: 0, y: 0.5 }, // relative within box [0..1]
      end: { x: 1, y: 0.5 },
      curved: false,
      curvePartitions: 2,
      // for bezier when curved = true (relative positions)
      cp1: { x: 0.33, y: 0.5 },
      cp2: { x: 0.66, y: 0.5 },
      styles: {
        stroke: "#111827",
        strokeWidth: 2,
        strokeOpacity: 1,
      },
    };
    const merged = {
      ...defaults,
      ...(init ?? {}),
      styles: { ...defaults.styles, ...(init?.styles ?? {}) },
    };
    super(parent, merged);
  }

  toComponent() { return null; }

  toImports() {
    return [``];
  }

  toReact() {
    const posRel = this.get("posRel") ?? { x: 0, y: 0 };
    const sizeRel = this.get("sizeRel") ?? { w: 0.2, h: 0.2 };
    const angle = this.get("angle") ?? 0;
    const curved = !!this.get("curved");
    const curvePartitions = Math.max(1, Math.min(2, parseInt(this.get("curvePartitions") ?? 2, 10)));
    const start = this.get("start") ?? { x: 0, y: 0.5 };
    const end = this.get("end") ?? { x: 1, y: 0.5 };
    const cp1 = this.get("cp1") ?? { x: 0.33, y: 0.5 };
    const cp2 = this.get("cp2") ?? { x: 0.66, y: 0.5 };

    const s = this.get("styles") ?? {};
    const stroke = s.stroke ?? "#111827";
    const strokeWidth = Number.isFinite(parseFloat(s.strokeWidth)) ? parseFloat(s.strokeWidth) : 2;
    const strokeOpacity = Number.isFinite(parseFloat(s.strokeOpacity)) ? parseFloat(s.strokeOpacity) : 1;

    // Render as an inline SVG inside DragResizeStatic container
    let body;
    if (curved) {
      const pathString = curvePartitions === 1
        ? `'M ${start.x * 100} ${start.y * 100} Q ${cp1.x * 100} ${cp1.y * 100}, ${end.x * 100} ${end.y * 100}'`
        : `'M ${start.x * 100} ${start.y * 100} C ${cp1.x * 100} ${cp1.y * 100}, ${cp2.x * 100} ${cp2.y * 100}, ${end.x * 100} ${end.y * 100}'`;
      body = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
  <path d={${pathString}} fill="none" stroke="${stroke}" strokeWidth={${strokeWidth}} strokeOpacity={${strokeOpacity}} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
</svg>`;
    } else {
      body = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
  <line x1={${start.x * 100}} y1={${start.y * 100}} x2={${end.x * 100}} y2={${end.y * 100}} stroke="${stroke}" strokeWidth={${strokeWidth}} strokeOpacity={${strokeOpacity}} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
</svg>`;
    }

    return `<DragResizeStatic 
  posRel={{x:${posRel.x}, y:${posRel.y}}}
  sizeRel={{w:${Math.max(sizeRel.w, 0.001)}, h:${Math.max(sizeRel.h, 0.001)}}}
  angle={${angle}}
  shapeType="rectangle"
  styles={{ backgroundColor: "transparent", borderWidth: "0px", borderStyle: "none", borderColor: "transparent", boxShadow: "none", overflow: "visible" }}
>
${body}
</DragResizeStatic>`;
  }
}


