import React from 'react';
import { ZoomIn } from 'lucide-react';
import { getImageUrl } from '../utils/api.js';

export default function ImageGrid({ images = [], legacyImage = '', onImageClick }) {
  // Normalize items array
  const items = React.useMemo(() => {
    let list = [];
    if (Array.isArray(images) && images.length > 0) {
      list = images.filter(Boolean);
    } else if (legacyImage) {
      list = [legacyImage];
    }
    return list.map(getImageUrl);
  }, [images, legacyImage]);

  if (items.length === 0) return null;

  const handleItemClick = (e, index) => {
    e.stopPropagation();
    if (onImageClick) {
      onImageClick(index);
    }
  };

  // 1 Image layout
  if (items.length === 1) {
    return (
      <div
        className="relative rounded-xl overflow-hidden bg-black/40 border border-border-warm max-h-[380px] w-full flex items-center justify-center p-1.5 cursor-pointer group shadow-inner"
        onClick={(e) => handleItemClick(e, 0)}
        title="Bấm để xem ảnh đầy đủ"
      >
        <img
          src={items[0]}
          alt="Attachment"
          className="max-h-[360px] max-w-full h-auto w-auto object-contain rounded-lg transition-serene group-hover:scale-[1.01]"
        />
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-serene flex items-center justify-center pointer-events-none">
          <span className="text-xs text-white bg-black/75 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg border border-white/10">
            <ZoomIn size={14} /> Phóng to ảnh
          </span>
        </div>
      </div>
    );
  }

  // 2 Images layout
  if (items.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden max-h-[320px] w-full">
        {items.map((src, idx) => (
          <div
            key={idx}
            className="relative h-56 sm:h-64 bg-black/40 border border-border-warm rounded-xl overflow-hidden cursor-pointer group"
            onClick={(e) => handleItemClick(e, idx)}
          >
            <img
              src={src}
              alt={`Photo ${idx + 1}`}
              className="w-full h-full object-cover transition-serene group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-serene flex items-center justify-center pointer-events-none">
              <ZoomIn size={18} className="text-white drop-shadow-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 3 Images layout
  if (items.length === 3) {
    return (
      <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden max-h-[320px] w-full">
        <div
          className="col-span-2 h-60 sm:h-64 bg-black/40 border border-border-warm rounded-xl overflow-hidden cursor-pointer group relative"
          onClick={(e) => handleItemClick(e, 0)}
        >
          <img
            src={items[0]}
            alt="Photo 1"
            className="w-full h-full object-cover transition-serene group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-serene flex items-center justify-center pointer-events-none">
            <ZoomIn size={20} className="text-white drop-shadow-md" />
          </div>
        </div>

        <div className="flex flex-col gap-2 h-60 sm:h-64">
          {items.slice(1, 3).map((src, idx) => (
            <div
              key={idx + 1}
              className="h-1/2 bg-black/40 border border-border-warm rounded-xl overflow-hidden cursor-pointer group relative"
              onClick={(e) => handleItemClick(e, idx + 1)}
            >
              <img
                src={src}
                alt={`Photo ${idx + 2}`}
                className="w-full h-full object-cover transition-serene group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-serene flex items-center justify-center pointer-events-none">
                <ZoomIn size={16} className="text-white drop-shadow-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4+ Images layout
  const displayItems = items.slice(0, 4);
  const remainingCount = items.length - 4;

  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden w-full">
      {displayItems.map((src, idx) => {
        const isFourth = idx === 3 && remainingCount > 0;
        return (
          <div
            key={idx}
            className="relative h-36 sm:h-44 bg-black/40 border border-border-warm rounded-xl overflow-hidden cursor-pointer group"
            onClick={(e) => handleItemClick(e, idx)}
          >
            <img
              src={src}
              alt={`Photo ${idx + 1}`}
              className="w-full h-full object-cover transition-serene group-hover:scale-105"
            />
            {isFourth ? (
              <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center transition-serene group-hover:bg-black/75">
                <span className="text-xl sm:text-2xl font-bold font-mono text-gold-accent tracking-wider">
                  +{remainingCount}
                </span>
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-serene flex items-center justify-center pointer-events-none">
                <ZoomIn size={18} className="text-white drop-shadow-md" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
