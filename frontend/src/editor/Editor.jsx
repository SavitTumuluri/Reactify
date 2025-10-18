import React from 'react'
import {NewEditableText} from "./test"
import {Draggable} from "./Draggable"
import DragResize from "./DragResize"

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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Future Canvas</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          id="future-canvas"
          className="w-full h-[70vh] bg-white rounded-lg shadow border border-gray-200 relative overflow-hidden"
        >
          <DragResize initialPos={{ x: 40, y: 40 }} initialSize={{ w: 260, h: 120 }}>
            <NewEditableText initialText="Drag me and resize me" />
          </DragResize>

          {/*<DragResize initialPos={{ x: 360, y: 160 }} initialSize={{ w: 220, h: 140 }}>
            {({ pos, size }) => (
              <div className="p-3">
                <div className="text-sm text-gray-500 mb-2">x:{pos.x} y:{pos.y} w:{size.w} h:{size.h}</div>
                <NewEditableText initialText="Second node" />
              </div>
            )}
          </DragResize> */}
        </div>
      </main>
    </div>
  );
}