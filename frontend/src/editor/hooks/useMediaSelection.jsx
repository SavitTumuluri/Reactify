import { useCallback } from "react";
import { IRRect } from "../components/DragResize";
import { IRImage } from "../components/ImageView";
import { IRVideo } from "../components/VideoView";

// --- media helpers ---
const IMAGE_EXTS = ["jpg","jpeg","png","gif","webp","bmp","tiff","svg"];
const VIDEO_EXTS = ["mp4","mov","webm","avi","mkv","m4v","qt"];
const getExt = (key = "") => (key.toLowerCase().match(/\.([a-z0-9]+)(?:\?.*)?$/i)?.[1] ?? "");
const isVideoKey = (key) => VIDEO_EXTS.includes(getExt(key));
const isImageKey = (key) => IMAGE_EXTS.includes(getExt(key));

export default function useMediaSelection({ ir, selected, setSelected, setIsGalleryOpen }) {
  return useCallback((item) => {
    const makeParentRect = () => new IRRect(ir);
    try {
      const isVid = isVideoKey(item.key);
      const isImg = isImageKey(item.key);
      if (!isVid && !isImg) return console.warn("Unsupported media:", item.key);

      const parentRect = selected instanceof IRRect ? selected : makeParentRect();
      if (isVid) new IRVideo(parentRect, { src: item.url });
      else new IRImage(parentRect, { src: item.url, alt: item.key });

      setSelected(parentRect);
    } finally {
      setIsGalleryOpen(false);
    }
  }, [ir, selected, setSelected, setIsGalleryOpen]);
}
