import React from "react";
import Draggable from "../components/ui/draggable";

export default function DragDemo() {
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
          <Draggable constrainToParent>
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
          </Draggable>
        </div>
      </section>

      <section>
        <h3>Grid snap + X-axis lock</h3>
        <div
          style={{
            position: "relative",
            height: 220,
            border: "1px dashed #d1d5db",
            borderRadius: 16,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <Draggable constrainToParent grid={{ x: 32, y: 32 }}>
            <div
              style={{
                width: 150,
                height: 64,
                borderRadius: 14,
                background: "#dcfce7",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 6px 16px rgba(0,0,0,.08)",
              }}
            >
              32×32 snap
            </div>
          </Draggable>

          <Draggable constrainToParent axis="x" grid={{ x: 24, y: 24 }}>
            <div
              style={{
                width: 150,
                height: 64,
                borderRadius: 14,
                background: "#fef3c7",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 6px 16px rgba(0,0,0,.08)",
              }}
            >
              X-axis only
            </div>
          </Draggable>
        </div>
      </section>

      <section>
        <h3>Drag handle + live position</h3>
        <div
          style={{
            position: "relative",
            height: 200,
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <Draggable constrainToParent handleSelector=".handle">
            {({ dragging, position }) => (
              <div
                style={{
                  width: 220,
                  borderRadius: 16,
                  background: "#fff",
                  boxShadow: "0 6px 16px rgba(0,0,0,.08)",
                  padding: 12,
                }}
              >
                <div
                  className="handle"
                  style={{ cursor: "grab", opacity: 0.7, marginBottom: 8, userSelect: "none" }}
                >
                  ≡ Drag from here
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {dragging ? "Dragging…" : "Idle"} — x:{position.x} y:{position.y}
                </div>
              </div>
            )}
          </Draggable>
        </div>
      </section>
    </div>
  );
}