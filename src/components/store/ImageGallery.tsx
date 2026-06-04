"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: {
    id: string;
    url: string;
    alt?: string;
    is_primary?: boolean;
  }[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-slate-100 flex items-center justify-center">
        <span className="text-slate-400">No images</span>
      </div>
    );
  }

  const mainImage = images[selectedIndex];

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={mainImage.url}
          alt={mainImage.alt || "Product image"}
          fill
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg transition ${
                selectedIndex === index
                  ? "ring-2 ring-slate-900"
                  : "ring-1 ring-slate-200"
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
              {image.is_primary && (
                <div className="absolute left-1 top-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-xs text-white">
                  Chính
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
