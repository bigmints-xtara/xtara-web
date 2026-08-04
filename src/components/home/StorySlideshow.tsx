"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Story } from "@/lib/firebase/firestore-service";
import StorySlide from "./StorySlide";

interface StorySlideshowProps {
    story: Story;
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    userId?: string;
}

const SLIDE_DURATION = 5000; // 5 seconds
const FADE_DURATION = 300; // 300ms

export default function StorySlideshow({ story, isOpen, onClose, onComplete, userId }: StorySlideshowProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const [savingCompletion, setSavingCompletion] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Brand colors for fallback (matching Flutter app)
    const brandColors = [
        '#003763', '#61B3E4', '#4EE2E2', '#F6B333',
        '#EF7521', '#61B3E4', '#4EE2E2', '#F6B333'
    ];

    const getBrandColor = (index: number) => {
        return brandColors[index % brandColors.length];
    };

    // Auto-advance timer
    useEffect(() => {
        if (!isOpen || isPaused) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    return 100;
                }
                return prev + (100 / (SLIDE_DURATION / 100));
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isOpen, isPaused, currentIndex]);

    // Handle slide completion
    useEffect(() => {
        if (progress >= 100) {
            if (currentIndex < story.slides.length - 1) {
                // Move to next slide
                handleNext();
            } else {
                // Complete story
                handleComplete();
            }
        }
    }, [progress, currentIndex, story.slides.length]);

    const handleNext = () => {
        if (currentIndex < story.slides.length - 1) {
            setFadeOut(true);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setProgress(0);
                setFadeOut(false);
            }, FADE_DURATION);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setFadeOut(true);
            setTimeout(() => {
                setCurrentIndex(prev => prev - 1);
                setProgress(0);
                setFadeOut(false);
            }, FADE_DURATION);
        }
    };

    const handleComplete = async () => {
        if (savingCompletion) return;
        setSavingCompletion(true);
        setSaveError(null);
        try {
            if (userId) {
                const { FirestoreService } = await import("@/lib/firebase/firestore-service");
                await FirestoreService.markStoryWatched(userId, story.id);
            }
            onComplete?.();
            handleClose();
        } catch (error) {
            console.error("Failed to save story completion", error);
            setIsPaused(true);
            setSaveError("Your progress was not saved.");
        } finally {
            setSavingCompletion(false);
        }
    };

    const handleClose = () => {
        setCurrentIndex(0);
        setProgress(0);
        setFadeOut(false);
        setSaveError(null);
        setSavingCompletion(false);
        onClose();
    };

    const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        if (x < width / 2) {
            handlePrevious();
        } else {
            handleNext();
        }
    };

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrevious();
            } else if (e.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentIndex]);

    if (!isOpen) return null;

    const currentSlide = story.slides[currentIndex];

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 text-white overflow-hidden flex items-center justify-center">
            {/* Centered container - mobile-like on desktop */}
            <div className="relative w-full h-full max-w-[500px] max-h-screen bg-black md:rounded-2xl md:shadow-2xl overflow-hidden">
                {/* Progress bars */}
                <div className="absolute top-0 left-0 right-0 z-[110] flex gap-1 p-4">
                    {story.slides.map((_, index) => (
                        <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                            {index < currentIndex && (
                                <div className="h-full w-full bg-white" />
                            )}
                            {index === currentIndex && (
                                <motion.div
                                    className="h-full bg-white"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.1 }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-[120] p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Close story"
                >
                    <X size={24} />
                </button>

                {saveError && (
                    <div className="absolute inset-x-4 bottom-6 z-[130] rounded-xl bg-black/85 p-4 text-center" role="alert">
                        <p className="text-sm">{saveError}</p>
                        <button
                            type="button"
                            className="mt-3 rounded-md bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                            onClick={(event) => {
                                event.stopPropagation();
                                void handleComplete();
                            }}
                            disabled={savingCompletion}
                        >
                            {savingCompletion ? "Saving…" : "Retry"}
                        </button>
                    </div>
                )}

                {/* Story content */}
                <div
                    onClick={handleTap}
                    className="absolute inset-0 cursor-pointer"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: fadeOut ? 0 : 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: FADE_DURATION / 1000 }}
                            className="w-full h-full"
                        >
                            <StorySlide
                                slide={currentSlide}
                                brandColor={getBrandColor(currentIndex)}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
