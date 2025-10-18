// src/components/ui/Text.jsx
import React, { useState, useRef, useEffect } from "react";
import { RegisterComponent } from "../state/ComponentRegistry";
import { IRText } from "../ir/IRText";

/**
 * IRText model:
 *  - text: string (may contain '\n')
 *  - styles: {
 *      color: css color (rgba recommended),
 *      textAlign: 'left' | 'center' | 'right',
 *      fontSize: number (px),
 *      fontWeight: string|number,
 *      lineHeight: number|string (e.g. 1.2 or '1.4' or '20px'),
 *      padding: css size,
 *    }
 */
// Link to the interactive component here to avoid circular imports
IRText.prototype.toComponent = function() { return NewEditableText };

export default function NewEditableText({ ir, bounds }) {
  ir.init();

  // Ensure styles exist / merged once
  useEffect(() => {
    const existing = ir.get?.("styles") ?? {};
    const defaults = {
      color: "rgba(0,0,0,1)",
      textAlign: "center",
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 1.2,
      padding: "8px",
      fontFamily: "Arial, sans-serif",
    };
    // Merge only missing keys
    let merged = { ...existing };
    let changed = false;
    for (const k of Object.keys(defaults)) {
      if (merged[k] === undefined) {
        merged[k] = defaults[k];
        changed = true;
      }
    }
    if (changed) ir.set("styles", merged);
  }, [ir]);

  // Reactive IR bindings (assumes your IR.useState syncs correctly)
  const [text = "", setTextIR] = ir?.useState?.("text") ?? ["", () => {}];
  const [styles = {}, setStylesIR] = ir?.useState?.("styles") ?? [{}, () => {}];

  const {
    textAlign = "center",
    color = "rgba(0,0,0,1)",
    fontSize = 14,
    fontWeight = "400",
    lineHeight = 1.2,
    padding = "8px",
    fontFamily = "Arial, sans-serif",
  } = styles;

  // Editing logic
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef(null);

  const handleDoubleClick = () => setIsEditing(true);
  const handleBlur = () => setIsEditing(false);

  const handleKeyDown = (e) => {
    // Allow Enter to make new lines; use Esc or Ctrl/Cmd+Enter to finish
    if (e.key === "Escape" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      textareaRef.current?.blur();
      setIsEditing(false);
    }
  };

  const handleChange = (e) => {
    setTextIR?.(e.target.value);
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // place cursor at end
      const el = textareaRef.current;
      el.selectionStart = el.selectionEnd = el.value.length;
    }
  }, [isEditing]);

  // Layout styles
  const justify =
    textAlign === "left" ? "flex-start" :
    textAlign === "right" ? "flex-end" : "center";

  const containerStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: justify,
    padding,
    color,
    cursor: isEditing ? "text" : "pointer",
  };

  const commonTextStyle = {
    width: "100%",
    textAlign,
    color,
    fontSize: `${fontSize}px`,
    fontWeight,                           // ← honors weight
    lineHeight,                           // ← honors line height (number or string)
    fontFamily,                           // ← honors font family
  };

  // Display uses pre-wrap to render \n as new lines
  const displayStyle = {
    ...commonTextStyle,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

  // Editing uses a textarea to capture newlines naturally
  const textareaStyle = {
    ...commonTextStyle,
    background: "transparent",
    outline: "none",
    border: "none",
    resize: "none",
    overflow: "auto",
    whiteSpace: "pre-wrap",
  };

  return (
    <div style={containerStyle} onDoubleClick={handleDoubleClick}>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          style={textareaStyle}
          rows={Math.min(12, Math.max(3, String(text).split("\n").length))}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Enter text…"
        />
      ) : (
        <div style={displayStyle}>
          {text || "Double-click to edit"}
        </div>
      )}
    </div>
  );
}

// Re-export for existing import sites
export { IRText } from "../ir/IRText";

RegisterComponent(IRText);
