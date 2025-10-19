import React from 'react';
import { listS3Images, deleteS3Files } from '../../lib/cdnService';

const IMAGE_EXTS = ['jpg','jpeg','png','gif','webp','bmp','tiff','svg'];
const VIDEO_EXTS = ['mp4','mov','webm','avi','mkv','m4v','qt'];

function getExt(key = '') {
  const m = key.toLowerCase().match(/\.([a-z0-9]+)(?:\?.*)?$/i);
  return m ? m[1] : '';
}
function isVideo(key) { return VIDEO_EXTS.includes(getExt(key)); }
function isImage(key) { return IMAGE_EXTS.includes(getExt(key)); }

function DurationBadge({ seconds }) {
  if (!Number.isFinite(seconds)) return null;
  const mm = Math.floor(seconds / 60);
  const ss = Math.floor(seconds % 60).toString().padStart(2, '0');
  return (
    <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white">
      {mm}:{ss}
    </span>
  );
}

function CheckOverlay({ checked }) {
  if (!checked) return null;
  return (
    <span className="absolute inset-0 bg-blue-500/20 pointer-events-none">
      <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 rounded bg-blue-600">
        <svg viewBox="0 0 24 24" width="14" height="14" className="fill-white">
          <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      </span>
    </span>
  );
}

function PlayIcon() {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/60">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="fill-white">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  );
}

/** Small top-right trash button that sits over the tile content */
function DeletePill({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-1 right-1 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600/90 text-white text-[10px] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
      title="Delete"
    >
      <svg viewBox="0 0 24 24" width="12" height="12" className="fill-white">
        <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 18a2 2 0 0 1-2-2V9h8v10a2 2 0 0 1-2 2H10z"/>
      </svg>
      Delete
    </button>
  );
}

/**
 * Unified tile wrapper to avoid nested <button> issues:
 * - Outer container: div.group.relative (clickable area inside)
 * - Inner "content button" covers the tile for select/preview
 * - Separate absolute DeletePill in the top-right (z-10)
 */
function VideoThumb({ item, onPrimaryClick, selectable, selected, onToggleSelect, onDeleteOne }) {
  const videoRef = React.useRef(null);
  const [duration, setDuration] = React.useState(null);

  const handleLoadedMetadata = () => {
    const d = videoRef.current?.duration;
    if (Number.isFinite(d)) setDuration(d);
  };
  const handleMouseEnter = () => {
    const v = videoRef.current;
    if (v) {
      if (v.currentTime < 0.05) v.currentTime = 0.05;
      v.play().catch(() => {});
    }
  };
  const handleMouseLeave = () => {
    const v = videoRef.current;
    if (v) v.pause();
  };

  const previewSrc = item.url.includes('#') ? item.url : `${item.url}#t=0.1`;
  const clickHandler = () => {
    if (selectable) onToggleSelect?.(item.key);
    else onPrimaryClick?.(item);
  };

  const deleteHandler = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await onDeleteOne?.(item.key);
  };

  return (
    <div
      className={`group relative rounded overflow-hidden bg-gray-800 border h-[144px]
        ${selected ? 'border-blue-500' : 'border-gray-700'}`}
      title={item.key}
    >
      <DeletePill onClick={deleteHandler} />
      <button
        type="button"
        onClick={clickHandler}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="absolute inset-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <video
          ref={videoRef}
          src={previewSrc}
          className="block w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          controls={false}
          disablePictureInPicture
          controlsList="nodownload noremoteplayback"
        />
        <PlayIcon />
        <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white">
          Video
        </span>
        <DurationBadge seconds={duration} />
        <CheckOverlay checked={!!selected} />
      </button>
    </div>
  );
}

function ImageThumb({ item, onPrimaryClick, selectable, selected, onToggleSelect, onDeleteOne }) {
  const clickHandler = () => {
    if (selectable) onToggleSelect?.(item.key);
    else onPrimaryClick?.(item);
  };

  const deleteHandler = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await onDeleteOne?.(item.key);
  };

  return (
    <div
      className={`group relative rounded overflow-hidden bg-gray-800 border h-[144px]
        ${selected ? 'border-blue-500' : 'border-gray-700'}`}
      title={item.key}
    >
      <DeletePill onClick={deleteHandler} />
      <button
        type="button"
        className="absolute inset-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={clickHandler}
      >
        {/* Even if the image is huge, it stays clipped to the tile; overlay sits above with z-10 */}
        <img src={item.url} alt={item.key} className="block w-full h-full object-cover" />
        <CheckOverlay checked={!!selected} />
      </button>
    </div>
  );
}

export default function ImageGallery({ open, onClose, onSelect }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [nextToken, setNextToken] = React.useState(null);

  // Batch clean-up mode (kept)
  const [selectMode, setSelectMode] = React.useState(false);
  const [selectedKeys, setSelectedKeys] = React.useState(new Set());
  const [deleting, setDeleting] = React.useState(false);

  const loadImages = React.useCallback(async (token) => {
    try {
      setLoading(true);
      const res = await listS3Images({ prefix: 'uploads/', token });
      setItems((prev) => (token ? [...prev, ...res.items] : res.items));
      setNextToken(res.nextToken);
    } catch (e) {
      console.error('Failed to load media', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      setSelectMode(false);
      setSelectedKeys(new Set());
      loadImages();
    }
  }, [open, loadImages]);

  const toggleSelect = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Single-item delete used by the per-tile trash button
  const deleteOne = async (key) => {
    const ok = window.confirm(`Delete this file?\n${key}\nThis cannot be undone.`);
    if (!ok) return;
    try {
      // Optimistic update after server confirms
      await deleteS3Files([key]);
      setItems((prev) => prev.filter((it) => it.key !== key));
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete. Please try again.');
    }
  };

  // Batch delete (existing header flow)
  const handleDeleteBatch = async () => {
    const keys = Array.from(selectedKeys);
    if (keys.length === 0) return;
    const ok = window.confirm(`Delete ${keys.length} file(s)? This cannot be undone.`);
    if (!ok) return;
    try {
      setDeleting(true);
      await deleteS3Files(keys);
      setItems((prev) => prev.filter((it) => !selectedKeys.has(it.key)));
      setSelectMode(false);
      setSelectedKeys(new Set());
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[420px] bg-gray-900 border-l border-gray-700 shadow-xl flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-200">My Media</h3>

          <div className="flex items-center gap-2">
            {selectMode ? (
              <>
                <button
                  onClick={handleDeleteBatch}
                  disabled={!selectedKeys.size || deleting}
                  className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : `Delete (${selectedKeys.size})`}
                </button>
                <button
                  onClick={() => { setSelectMode(false); setSelectedKeys(new Set()); }}
                  disabled={deleting}
                  className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setSelectMode(true)}
                className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
                title="Clean up (batch select)"
              >
                Clean up
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white" title="Close">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 grid grid-cols-2 gap-3 auto-rows-[144px]">
          {items.map((it) => {
            const selectable = selectMode;
            const selected = selectedKeys.has(it.key);
            if (isVideo(it.key)) {
              return (
                <VideoThumb
                  key={it.key}
                  item={it}
                  onPrimaryClick={onSelect}
                  selectable={selectable}
                  selected={selected}
                  onToggleSelect={toggleSelect}
                  onDeleteOne={deleteOne}
                />
              );
            }
            if (isImage(it.key)) {
              return (
                <ImageThumb
                  key={it.key}
                  item={it}
                  onPrimaryClick={onSelect}
                  selectable={selectable}
                  selected={selected}
                  onToggleSelect={toggleSelect}
                  onDeleteOne={deleteOne}
                />
              );
            }
            return null;
          })}
          {loading && <div className="col-span-2 text-center text-xs text-gray-400">Loading…</div>}
        </div>

        <div className="p-3 border-t border-gray-700 flex justify-end">
          {nextToken && !selectMode && (
            <button
              onClick={() => loadImages(nextToken)}
              className="px-3 py-1 text-sm bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
            >
              Load more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
