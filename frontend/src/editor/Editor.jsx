// src/components/ui/Editor.jsx
import React from "react";
import DragResize, {IRRect} from "./DragResize";
import { NewEditableText, IRText } from "./IR";
import CanvasContainer, {IRCanvasContainer} from "./Canvas";
import NewComponent from "./testcanvas"

export default function EditorPage() {
  // selection state (ID of the active node, or null)
  const [selectedId, setSelectedId] = React.useState(null);

  const [bounds, setBounds] = React.useState({ w: 1000, h: 600 });


  let ir = new IRCanvasContainer()
  for(let i=0;i<5;i++) {
    let dragresize = new IRRect(ir)
    let text = new IRText(dragresize)
  }

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
        <CanvasContainer
          id="future-canvas"
          size={bounds}
          ir = {ir}

        >
          
        </CanvasContainer>
        <NewComponent></NewComponent>
      </main>
    </div>
  );
}