"use client";

import { StorySlide as StorySlideType } from "@/lib/api/content";
import { ExternalLink } from "lucide-react";
import { useState } from "react";

interface StorySlideProps {
    slide: StorySlideType;
    brandColor: string;
}

export default function StorySlide({ slide, brandColor }: StorySlideProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const handleHyperlinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (slide.hyperlink) {
            window.open(slide.hyperlink, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="relative w-full h-full">
            {/* Background image or color */}
            <div
                className="absolute inset-0"
                style={{ backgroundColor: brandColor }}
            >
                {slide.image && !imageError && (
                    <img
                        src={slide.image}
                        alt={slide.title}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                    />
                )}
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
                <div className="max-w-3xl">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                        {slide.title}
                    </h1>
                    <p className="text-base md:text-lg text-white/90 mb-6 leading-relaxed">
                        {slide.description}
                    </p>

                    {/* Hyperlink button */}
                    {slide.hyperlink && slide.hyperlinkText && (
                        <button
                            onClick={handleHyperlinkClick}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-full transition-all"
                        >
                            <span className="text-white font-medium text-sm">
                                {slide.hyperlinkText}
                            </span>
                            <ExternalLink size={16} className="text-white" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
