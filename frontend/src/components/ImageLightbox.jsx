import React from 'react';
import { X } from 'lucide-react';

export default function ImageLightbox({ src, alt = 'View full size', isOpen, onClose }) {
  if (!isOpen || !src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in cursor-zoom-out"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-full bg-zinc-900/80 border border-zinc-700 transition-serene cursor-pointer z-10"
        title="Đóng"
      >
        <X size={20} />
      </button>

      <div
        className="relative max-w-[92vw] max-h-[90vh] flex items-center justify-center overflow-hidden rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-xl select-none"
        />
      </div>
    </div>
  );
}
