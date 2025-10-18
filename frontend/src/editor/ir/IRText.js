import { IRView } from "../core/IR";

export class IRText extends IRView {
  constructor(parent, inputs = {}) {
    const defaultStyles = {
      color: "rgba(0,0,0,1)",
      textAlign: "center",
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 1.2,
      padding: "8px",
      fontFamily: "Arial, sans-serif",
    };
    super(parent, {
      text: "",
      ...inputs,
      styles: { ...defaultStyles, ...(inputs.styles ?? {}) },
    });
  }

  toReact() {
    const text = this.get("text") ?? "";
    const s = this.get("styles") ?? {};

    const textJSON = JSON.stringify(text);
    const textAlign = s.textAlign ?? "center";
    const color = s.color ?? "rgba(0,0,0,1)";
    const fontSize = s.fontSize ?? 14;
    const fontWeight = s.fontWeight ?? "400";
    const lineHeight = s.lineHeight ?? 1.2;
    const padding = s.padding ?? "8px";
    const fontFamily = s.fontFamily ?? "Arial, sans-serif";

    const justify =
      textAlign === "left" ? "flex-start" :
      textAlign === "right" ? "flex-end" : "center";

    return `<div style={{
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "${justify}",
  padding: "${padding}",
  color: "${color}"
}}>
  <div style={{
    width: "100%",
    textAlign: "${textAlign}",
    color: "${color}",
    fontSize: "${fontSize}px",
    fontWeight: "${fontWeight}",
    lineHeight: ${typeof lineHeight === "number" ? lineHeight : `"${lineHeight}"`},
    fontFamily: "${fontFamily}",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  }}>
    {${textJSON}}
  </div>
</div>`;
  }
}


