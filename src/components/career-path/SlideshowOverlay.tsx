"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import UniversalSlide from "./UniversalSlide";
import { CareerSlideData } from "@/types/career";

interface SlideshowOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    slides: CareerSlideData[];
}

export default function SlideshowOverlay({ isOpen, onClose, slides }: SlideshowOverlayProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const close = () => {
        setCurrentIndex(0);
        onClose();
    };

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            close();
        }
    };

    if (!isOpen || !slides.length) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-[#12192E] text-white overflow-hidden flex flex-col" role="dialog" aria-modal="true" aria-label="Career Conversation">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20 pointer-events-none" />

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-[110]">
                <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            {/* Close Button */}
            <button
                onClick={close}
                aria-label="Close Career Conversation"
                className="absolute top-4 right-4 z-[120] p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
                <X size={24} />
            </button>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 pt-12"
                >
                    <UniversalSlide
                        slideData={slides[currentIndex]}
                        onButtonClick={handleNext}
                        isLastSlide={currentIndex === slides.length - 1}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
