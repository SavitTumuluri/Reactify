import { IRView } from "../core/IR";
import getStateManager from "../state/GlobalStateManager";

const history = getStateManager().history;

export class IRImage extends IRView {
  constructor(parent, inputs = {}) {
    const defaultStyles = {
      objectFit: "cover",
      objectPosition: "50% 50%",
      opacity: 1,
    };
    const merged = {
      src: "",
      alt: "",
      ...inputs,
      styles: { ...defaultStyles, ...(inputs.styles ?? {}) },
    };
    super(parent, merged);
  }

  toReact() {
    const src = JSON.stringify(this.get("src") ?? "");
    const alt = JSON.stringify(this.get("alt") ?? "");
    const s = this.get("styles") ?? {};
    const objectFit = s.objectFit ?? "cover";
    const objectPosition = s.objectPosition ?? "50% 50%";
    const opacity = typeof s.opacity === "number" ? s.opacity : 1;

    return `<img src={${src}} alt={${alt}} style={{
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "${objectFit}",
  objectPosition: "${objectPosition}",
  opacity: ${opacity}
}} />`;
  }
}


