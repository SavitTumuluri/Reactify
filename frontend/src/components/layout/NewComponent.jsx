
import {useState,useRef,useEffect} from "react"
import GraphicBox from "../../editor/CanvasStatic";
import DragResizeStatic from "../../editor/components/DragResizeStatic";





export const NewComponent = (props) => {
  
  const canvasBackground = "rgba(73, 70, 210, 1)";
  return <GraphicBox canvasBackground={canvasBackground}><DragResizeStatic 
      posRel={{x:0, y:0}} 
      sizeRel={{w:1.0223783413224523, h:0.15}} 
      angle={0}
      shapeType="rectangle"
      styles={{
        backgroundColor: "#ffffff",
        borderWidth: "0px",
        borderStyle: "solid",
        borderColor: "transparent",
        borderRadius: "12px",
        boxShadow: "0 6px 16px rgba(0,0,0,.06)",
        overflow: "hidden"
      }}
    >
</DragResizeStatic>
</GraphicBox>
}
    