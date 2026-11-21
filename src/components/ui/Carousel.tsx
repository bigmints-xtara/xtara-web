"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, Children } from "react";

interface CarouselProps {
    children: React.ReactNode;
    itemWidth: number; // Width of each item in pixels
    gap?: number; // Gap between items in pixels
}

export default function Carousel({ children, itemWidth, gap = 24 }: CarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

            // Calculate current page
            const itemsPerPage = Math.floor(clientWidth / (itemWidth + gap));
            const totalItems = Children.count(children);
            const total = Math.ceil(totalItems / itemsPerPage);
            const current = Math.floor(scrollLeft / (itemWidth + gap) / itemsPerPage) + 1;

            setCurrentPage(Math.min(current, total));
            setTotalPages(total);
        }
    };

    useEffect(() => {
        checkScroll();
        const current = scrollRef.current;
        if (current) {
            current.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
            return () => {
                current.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [children, itemWidth, gap]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = itemWidth + gap;
            const targetScroll = direction === 'left'
                ? scrollRef.current.scrollLeft - scrollAmount
                : scrollRef.current.scrollLeft + scrollAmount;

            scrollRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative">
            {/* Left Arrow - Always visible when can scroll */}
            {canScrollLeft && (
                <Button variant="ghost" size="icon"
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
                    aria-label="Scroll left"
                >
                    <ChevronLeft size={16} strokeWidth={3} />
                </Button>
            )}

            {/* Carousel Container */}
            <div className="-mx-4 md:-mx-8">
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 py-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {children}
                </div>
            </div>

            {/* Right Arrow - Always visible when can scroll */}
            {canScrollRight && (
                <Button variant="ghost" size="icon"
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
                    aria-label="Scroll right"
                >
                    <ChevronRight size={16} strokeWidth={3} />
                </Button>
            )}

            {/* Page Indicator - Airbnb style */}
            {totalPages > 1 && (
                <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-full text-xs font-semibold ">
                    {currentPage} / {totalPages}
                </div>
            )}
        </div>
    );
}
