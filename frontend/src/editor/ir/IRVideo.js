import { IRView } from "../core/IR";
import getStateManager from "../state/GlobalStateManager";

const history = getStateManager().history; // kept for parity with IRImage import pattern

export class IRVideo extends IRView {
  constructor(parent, inputs = {}) {
    const defaultStyles = {
      objectFit: "cover",
      objectPosition: "50% 50%",
      opacity: 1,
    };
    const merged = {
      // video source & poster
      src: "",
      poster: "",
      // playback flags (React boolean props)
      controls: true,
      autoplay: false,
      loop: false,
      muted: false,       // tip: browsers require muted=true for autoplay to take effect
      playsInline: true,  // iOS inline playback
      preload: "metadata", // "none" | "metadata" | "auto"
      ...inputs,
      styles: { ...defaultStyles, ...(inputs.styles ?? {}) },
    };
    super(parent, merged);
  }

  toReact() {
    const src = JSON.stringify(this.get("src") ?? "");
    const poster = JSON.stringify(this.get("poster") ?? "");

    const controls   = !!this.get("controls");
    const autoplay   = !!this.get("autoplay");
    const loop       = !!this.get("loop");
    const muted      = !!this.get("muted");
    const playsInline= !!this.get("playsInline");
    const preload    = JSON.stringify(this.get("preload") ?? "metadata");

    const s = this.get("styles") ?? {};
    const objectFit      = s.objectFit ?? "cover";
    const objectPosition = s.objectPosition ?? "50% 50%";
    const opacity        = typeof s.opacity === "number" ? s.opacity : 1;

    // Note: React boolean props render correctly with {...bool}
    return `<video
  src={${src}}
  poster={${poster}}
  controls={${controls}}
  autoPlay={${autoplay}}
  loop={${loop}}
  muted={${muted}}
  playsInline={${playsInline}}
  preload={${preload}}
  style={{
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "${objectFit}",
    objectPosition: "${objectPosition}",
    opacity: ${opacity}
  }}
/>`;
  }
}
