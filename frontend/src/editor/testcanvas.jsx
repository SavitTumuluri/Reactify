import {useState,useRef,useEffect} from "react"
import DragResizeStatic from "./DragResizeStatic"
import GraphicBox from "./CanvasStatic"




export default function NewComponent(props) {
  
  return <GraphicBox size = {{w: 1200, h: 800}} background = {"#ffffff"}><DragResizeStatic posRel={{x:0.7308333333333334, y:0.3625}} sizeRel={{w:0.18333333333333332, h:0.15}} angle={0}><div></div>

</DragResizeStatic>
<DragResizeStatic posRel={{x:0.1958333333333333, y:0.14375000000000002}} sizeRel={{w:0.25, h:0.24875}} angle={342.27814359797816}><div></div>

</DragResizeStatic>
<DragResizeStatic posRel={{x:0.42, y:0.35249999999999987}} sizeRel={{w:0.18333333333333332, h:0.15}} angle={0}><div></div>

</DragResizeStatic>
<DragResizeStatic posRel={{x:0.04416666666666666, y:0.56625}} sizeRel={{w:0.18333333333333332, h:0.15}} angle={0}><div></div>

</DragResizeStatic>
<DragResizeStatic posRel={{x:0.64, y:0.14125000000000001}} sizeRel={{w:0.18333333333333332, h:0.15}} angle={0}><div></div>

</DragResizeStatic>
</GraphicBox>
}