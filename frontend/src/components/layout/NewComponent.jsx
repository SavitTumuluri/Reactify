
import {useState,useRef,useEffect} from "react"
import GraphicBox from "../../editor/CanvasStatic";
import DragResizeStatic from "../../editor/components/DragResizeStatic";




export const NewComponent = (props) => {
  
  const canvasBackground = "rgba(96, 11, 11, 1)";
  return <GraphicBox canvasBackground={canvasBackground}><DragResizeStatic 
      posRel={{x:0.156865234375, y:0.18602783203125}} 
      sizeRel={{w:0.2, h:0.2}} 
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
<DragResizeStatic 
      posRel={{x:0.4010400390625, y:0.37412841796874996}} 
      sizeRel={{w:0.2, h:0.2}} 
      angle={0}
      shapeType="rectangle"
      styles={{
        backgroundColor: "transparent",
        borderWidth: "0px",
        borderStyle: "none",
        borderColor: "transparent",
        borderRadius: "12px",
        boxShadow: "none",
        overflow: "visible"
      }}
    ><div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible"
      }} dangerouslySetInnerHTML={{__html: "<svg width=\"512\" height=\"512\" viewBox=\"0 0 512 512\">\n  <path d=\"M256 40.7l54.5 110.4 121.8 17.7-88.2 86 20.8 121.3-108.9-57.2-108.9 57.2 20.8-121.3-88.2-86 121.8-17.7z\" fill=\"#FFD700\" stroke=\"#FFA500\" stroke-width=\"10\"/>\n</svg>"}} />
</DragResizeStatic>
</GraphicBox>
}
    