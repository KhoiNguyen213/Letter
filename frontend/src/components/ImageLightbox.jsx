import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Image as ImageIcon
} from 'lucide-react';
import { getImageUrl } from '../utils/api.js';

export default function ImageLightbox({
  isOpen,
  onClose,
  images = [],
  src = '',
  initialIndex = 0,
  alt = 'Image view',
}) {
  // Normalize input images to array of string URLs
  const imageList = React.useMemo(() => {
    if (Array.isArray(images) && images.length > 0) {
      return images.map(getImageUrl).filter(Boolean);
    }
    if (src) {
      return [getImageUrl(src)];
    }
    return [];
  }, [images, src]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const containerRef = useRef(null);
  const touchStartDist = useRef(null);

  // Sync initial index when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      const idx = Math.max(0, Math.min(initialIndex, imageList.length - 1));
      setCurrentIndex(idx);
      resetTransform();
      setImageError(false);
    }
  }, [isOpen, initialIndex, imageList.length]);

  const resetTransform = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    if (imageList.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
    resetTransform();
    setImageError(false);
  }, [imageList.length, resetTransform]);

  const handleNext = useCallback(() => {
    if (imageList.length <= 1) return;
    setCurrentIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
    resetTransform();
    setImageError(false);
  }, [imageList.length, resetTransform]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.3, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.3, 0.6);
      if (newScale <= 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      resetTransform();
    } else {
      setScale(2.2);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotateRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Mouse Wheel Zooming
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.15, 4));
    } else {
      setScale((prev) => {
        const newScale = Math.max(prev - 0.15, 0.6);
        if (newScale <= 1) setPosition({ x: 0, y: 0 });
        return newScale;
      });
    }
  };

  // Dragging / Panning
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch Gestures (Pinch to Zoom & Touch Pan)
  const getTouchDistance = (touches) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchStartDist.current = getTouchDistance(e.touches);
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist.current) {
      const currentDist = getTouchDistance(e.touches);
      const ratio = currentDist / touchStartDist.current;
      setScale((prev) => Math.max(0.6, Math.min(prev * ratio, 4)));
      touchStartDist.current = currentDist;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
    setIsDragging(false);
  };

  // Download Current Image
  const handleDownload = async () => {
    const currentUrl = imageList[currentIndex];
    if (!currentUrl) return;

    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `photo-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(currentUrl, '_blank');
    }
  };

  const toggleFullscreenMode = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen || imageList.length === 0) return null;

  const currentUrl = imageList[currentIndex];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/92 backdrop-blur-lg select-none animate-fade-in"
      onClick={onClose}
    >
      {/* Top Controls Toolbar */}
      <div
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Counter badge */}
        <div className="flex items-center gap-2">
          {imageList.length > 1 && (
            <span className="px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-xs font-mono text-gold-accent shadow-md">
              {currentIndex + 1} / {imageList.length}
            </span>
          )}
          <span className="text-xs text-zinc-400 font-serif italic hidden sm:inline">
            Zalo Lightbox Viewer
          </span>
        </div>

        {/* Center: Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900/90 border border-zinc-700/80 p-1.5 rounded-full shadow-2xl backdrop-blur-md">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full transition-serene cursor-pointer"
            title="Phóng to (+)"
          >
            <ZoomIn size={17} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full transition-serene cursor-pointer"
            title="Thu nhỏ (-)"
          >
            <ZoomOut size={17} />
          </button>
          <div className="w-[1px] h-4 bg-zinc-700 mx-0.5" />
          <button
            onClick={handleRotateLeft}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full transition-serene cursor-pointer"
            title="Xoay trái 90°"
          >
            <RotateCcw size={17} />
          </button>
          <button
            onClick={handleRotateRight}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full transition-serene cursor-pointer"
            title="Xoay phải 90° (R)"
          >
            <RotateCw size={17} />
          </button>
          <div className="w-[1px] h-4 bg-zinc-700 mx-0.5" />
          <button
            onClick={resetTransform}
            className="p-1.5 text-zinc-300 hover:text-gold-accent hover:bg-zinc-800 rounded-full transition-serene cursor-pointer text-xs px-2 font-sans"
            title="Đặt lại góc & kích thước"
          >
            Reset
          </button>
          <div className="w-[1px] h-4 bg-zinc-700 mx-0.5" />
          <button
            onClick={handleDownload}
            className="p-1.5 text-zinc-300 hover:text-emerald-400 hover:bg-zinc-800 rounded-full transition-serene cursor-pointer"
            title="Tải ảnh về máy"
          >
            <Download size={17} />
          </button>
          <button
            onClick={toggleFullscreenMode}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full transition-serene cursor-pointer hidden sm:block"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>

        {/* Right: Close button */}
        <button
          onClick={onClose}
          className="p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900/80 border border-zinc-700 transition-serene cursor-pointer shadow-lg"
          title="Đóng (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Image Display Area */}
      <div
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden p-4"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Next / Previous Arrow Buttons */}
        {imageList.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-serene shadow-2xl cursor-pointer"
              title="Ảnh trước (Mũi tên Trái)"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-serene shadow-2xl cursor-pointer"
              title="Ảnh tiếp theo (Mũi tên Phải)"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Image / Error Container */}
        {imageError ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 font-serif">
            <ImageIcon size={48} className="text-zinc-600 animate-pulse" />
            <p className="text-sm">Không thể tải hình ảnh này</p>
            <span className="text-xs font-sans text-zinc-600 break-all max-w-md text-center">
              {currentUrl}
            </span>
          </div>
        ) : (
          <img
            src={currentUrl}
            alt={alt}
            onDoubleClick={handleDoubleClick}
            onError={() => setImageError(true)}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            }}
            className="max-w-[90vw] max-h-[80vh] w-auto h-auto object-contain rounded-lg shadow-2xl select-none"
            draggable={false}
          />
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multiple images) */}
      {imageList.length > 1 && (
        <div
          className="w-full py-3 px-4 flex items-center justify-center gap-2 overflow-x-auto bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {imageList.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                resetTransform();
                setImageError(false);
              }}
              className={`relative rounded-lg overflow-hidden border-2 transition-serene flex-shrink-0 cursor-pointer ${
                idx === currentIndex
                  ? 'border-gold-accent scale-105 shadow-lg'
                  : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumb ${idx + 1}`}
                className="w-12 h-12 object-cover rounded"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
