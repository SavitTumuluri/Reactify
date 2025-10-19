
import {useState,useRef,useEffect} from "react"
import GraphicBox from "../../editor/CanvasStatic";
import DragResizeStatic from "../../editor/components/DragResizeStatic";

export const NewComponent = (props) => {
  
  const canvasBackground = "rgba(255, 255, 255, 1)";
  return <GraphicBox canvasBackground={canvasBackground}><DragResizeStatic 
      posRel={{x:0.05, y:0.05}} 
      sizeRel={{w:0.2, h:0.2}} 
      angle={0}
      shapeType="star"
      styles={{
        backgroundColor: "#FFDE00",
        borderWidth: "0px",
        borderStyle: "solid",
        borderColor: "transparent",
        borderRadius: "0px",
        boxShadow: "0 6px 16px rgba(0,0,0,.06)",
        overflow: "hidden",
        clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
      }}
    ></DragResizeStatic>
<DragResizeStatic 
      posRel={{x:0.2, y:0.05}} 
      sizeRel={{w:0.06, h:0.06}} 
      angle={30}
      shapeType="star"
      styles={{
        backgroundColor: "#FFDE00",
        borderWidth: "0px",
        borderStyle: "solid",
        borderColor: "transparent",
        borderRadius: "0px",
        boxShadow: "0 6px 16px rgba(0,0,0,.06)",
        overflow: "hidden",
        clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
      }}
    ></DragResizeStatic>
<DragResizeStatic 
      posRel={{x:0.28, y:0.12}} 
      sizeRel={{w:0.06, h:0.06}} 
      angle={60}
      shapeType="star"
      styles={{
        backgroundColor: "#FFDE00",
        borderWidth: "0px",
        borderStyle: "solid",
        borderColor: "transparent",
        borderRadius: "0px",
        boxShadow: "0 6px 16px rgba(0,0,0,.06)",
        overflow: "hidden",
        clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
      }}
    ></DragResizeStatic>
<DragResizeStatic 
      posRel={{x:0.28, y:0.22}} 
      sizeRel={{w:0.06, h:0.06}} 
      angle={90}
      shapeType="star"
      styles={{
        backgroundColor: "#FFDE00",
        borderWidth: "0px",
        borderStyle: "solid",
        borderColor: "transparent",
        borderRadius: "0px",
        boxShadow: "0 6px 16px rgba(0,0,0,.06)",
        overflow: "hidden",
        clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
      }}
    ></DragResizeStatic>
<DragResizeStatic 
      posRel={{x:0.2, y:0.29}} 
      sizeRel={{w:0.06, h:0.06}} 
      angle={120}
      shapeType="star"
      styles={{
        backgroundColor: "#FFDE00",
        borderWidth: "0px",
        borderStyle: "solid",
        borderColor: "transparent",
        borderRadius: "0px",
        boxShadow: "0 6px 16px rgba(0,0,0,.06)",
        overflow: "hidden",
        clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
      }}
    ></DragResizeStatic>
<DragResizeStatic 
      posRel={{x:0, y:0}} 
      sizeRel={{w:1, h:0.33}} 
      angle={0}
      shapeType="rectangle"
      styles={{
        backgroundColor: "#00966E",
        borderWidth: "0px",
        borderStyle: "solid",
        borderColor: "transparent",
        borderRadius: "12px",
        boxShadow: "0 6px 16px rgba(0,0,0,.06)",
        overflow: "hidden"
      }}
    >
</DragResizeStatic>
<DragResizeStatic 
      posRel={{x:0, y:0.33}} 
      sizeRel={{w:1, h:0.34}} 
      angle={0}
      shapeType="rectangle"
      styles={{
        backgroundColor: "#FFFFFF",
        borderWidth: "0px",
        borderStyle: "solid",
        borderColor: "transparent",
        borderRadius: "12px",
        boxShadow: "0 6px 16px rgba(0,0,0,.06)",
        overflow: "hidden"
      }}
    >
</DragResizeStatic>
<DragResizeStatic 
      posRel={{x:0, y:0.67}} 
      sizeRel={{w:1, h:0.33}} 
      angle={0}
      shapeType="rectangle"
      styles={{
        backgroundColor: "#D62612",
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