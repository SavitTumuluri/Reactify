import React, { useEffect } from "react";
import { RegisterComponent } from "../state/ComponentRegistry";
import { IRImage } from "../ir/IRImage";

// Link IRImage to this interactive component without circular import
IRImage.prototype.toComponent = function () { return ImageView };

export default function ImageView({ ir }) {
  ir.init();

  // Ensure defaults merged once
  useEffect(() => {
    const existing = ir.get?.("styles") ?? {};
    const defaults = {
      objectFit: "contain",
      objectPosition: "50% 50%",
      opacity: 1,
    };
    const needsMerge = Object.keys(defaults).some((k) => existing[k] === undefined);
    if (needsMerge) ir.set("styles", { ...defaults, ...existing });
  }, [ir]);

  const [src = ""] = ir?.useState?.("src") ?? [""];
  const [alt = ""] = ir?.useState?.("alt") ?? [""];
  const [styles = {}] = ir?.useState?.("styles") ?? [{}];

  const objectFit = styles.objectFit ?? "cover";
  const objectPosition = styles.objectPosition ?? "50% 50%";
  const opacity = typeof styles.opacity === "number" ? styles.opacity : 1;

  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        objectFit,
        objectPosition,
        opacity,
        pointerEvents: "none",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1,
      }}
    />
  );
}

// Re-export for existing import sites
export { IRImage } from "../ir/IRImage";

RegisterComponent(IRImage);


