"use client";

import Image from 'next/image';
import { useState } from 'react';

interface GameGalleryProps {
  gallery: string[];
  title: string;
  onImageSelect?: (image: string) => void;
}

export default function GameGallery({ gallery, title, onImageSelect }: GameGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);

  if (!gallery || gallery.length === 0) {
    return null;
  }

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
    if (onImageSelect) {
      onImageSelect(image);
    }
    setShowFullImage(true);
  };

  return (
    <div className="mb-12 md:border-t md:border-border md:pt-12">
      <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {gallery.map((image: string, index: number) => (
          <div
            key={index}
            className={`relative aspect-video rounded-md overflow-hidden cursor-pointer transition-all duration-200 ${
              selectedImage === image ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleImageClick(image)}
          >
            <Image
              src={image}
              alt={`${title} screenshot ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Full screen image view */}
      {showFullImage && selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative w-full max-w-4xl aspect-video">
            <Image
              src={selectedImage}
              alt={`${title} full screen view`}
              fill
              className="object-contain"
            />
          </div>
          <button 
            className="absolute top-4 right-4 text-white text-xl"
            onClick={() => setShowFullImage(false)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}