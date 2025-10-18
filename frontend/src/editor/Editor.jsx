import React from 'react'
import {NewEditableText} from "./test"
import {Draggable} from "./Draggable"
function DraggableStatic({children,style,className}) {
        const content =
        typeof children === "function"
        ? children({dragging:false, position: {x:565,y:101} })
        : children;
        const wrapperStyle = {
        transform: "translate(565px, 101px)",
        touchAction: "none",
        ...style,
    };

        return (
        <div
        className={["inline-block select-none", className].filter(Boolean).join(" ")}
        style={wrapperStyle}
        tabIndex={0}
        >
        {content}
        </div>)
    }

export default function EditorPage() {
  return (
    <div style={{ padding: 24, display: "grid", gap: 24 }}>
      <section>
        <h3>Free drag (bounded to parent)</h3>
        <div
          style={{
            position: "relative",
            height: 260,
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <DraggableStatic constrainToParent>
            <div
              style={{
                width: 160,
                height: 80,
                borderRadius: 16,
                background: "#eef2ff",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 6px 16px rgba(0,0,0,.08)",
              }}
            >
              Drag me
            </div>
          </DraggableStatic>
        </div>
      </section>
    </div>)
}