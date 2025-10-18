import React, { useEffect } from "react";
import { RegisterComponent } from "../state/ComponentRegistry";
import { IRVideo } from "../ir/IRVideo";

// Link IRVideo to this interactive component without circular import
IRVideo.prototype.toComponent = function () { return VideoView };

export default function VideoView({ ir }) {
  ir.init();

  // Ensure defaults merged once (keeps parity with ImageView pattern)
  useEffect(() => {
    const existing = ir.get?.("styles") ?? {};
    const defaults = {
      objectFit: "cover",
      objectPosition: "50% 50%",
      opacity: 1,
    };
    const needsMerge = Object.keys(defaults).some((k) => existing[k] === undefined);
    if (needsMerge) ir.set("styles", { ...defaults, ...existing });
  }, [ir]);

  // Data / props
  const [src = ""]          = ir?.useState?.("src") ?? [""];
  const [poster = ""]       = ir?.useState?.("poster") ?? [""];
  const [controls = true]   = ir?.useState?.("controls") ?? [true];
  const [autoplay = false]  = ir?.useState?.("autoplay") ?? [false];
  const [loop = false]      = ir?.useState?.("loop") ?? [false];
  const [muted = false]     = ir?.useState?.("muted") ?? [false];
  const [playsInline = true]= ir?.useState?.("playsInline") ?? [true];
  const [preload = "metadata"] = ir?.useState?.("preload") ?? ["metadata"];

  // Styles
  const [styles = {}] = ir?.useState?.("styles") ?? [{}];
  const objectFit = styles.objectFit ?? "cover";
  const objectPosition = styles.objectPosition ?? "50% 50%";
  const opacity = typeof styles.opacity === "number" ? styles.opacity : 1;

  return (
    <video
      src={src}
      poster={poster}
      controls={controls}
      autoPlay={autoplay}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
      onClick={(e) => {
        // Prevent surface click from toggling play/pause; use the controls instead
        e.preventDefault();
      }}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        objectFit,
        objectPosition,
        opacity,
        pointerEvents: "auto", // allow interaction and let parent handle drags
      }}
    />
  );
}

// Re-export for existing import sites symmetry
export { IRVideo } from "../ir/IRVideo";

RegisterComponent(IRVideo);
