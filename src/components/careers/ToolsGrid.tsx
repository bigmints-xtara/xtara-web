"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

export interface ToolGridItem {
    id: string;
    title: string;
    description?: string;
    [key: string]: any;
}

interface ToolsGridProps {
    items: ToolGridItem[];
    emptyMessage?: string;
    onItemClick?: (item: ToolGridItem) => void;
    initialDisplay?: number;
}

export default function ToolsGrid({
    items,
    emptyMessage = "No tools available.",
    onItemClick,
    initialDisplay = 6
}: ToolsGridProps) {
    const [displayCount, setDisplayCount] = useState(initialDisplay);

    if (items.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>{emptyMessage}</p>
            </div>
        );
    }

    const visibleItems = items.slice(0, displayCount);
    const hasMore = displayCount < items.length;

    return (
        <div>
            {/* Grid of tools */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {visibleItems.map((item) => (
                    <Button variant="surface"
                        key={item.id}
                        onClick={() => onItemClick?.(item)}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover: transition-all text-center group"
                    >
                        {/* Tool Icon/Image placeholder - can add actual icons later */}
                        <div className="w-12 h-12 mx-auto mb-3 bg-blue-50 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🔧</span>
                        </div>

                        {/* Tool Name */}
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                            {item.title}
                        </h4>

                        {/* Optional description - very compact */}
                        {item.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">
                                {item.description.substring(0, 30)}...
                            </p>
                        )}
                    </Button>
                ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className="mt-6 text-center">
                    <Button variant="outline"
                      onClick={() => setDisplayCount(prev => Math.min(prev + initialDisplay, items.length))}
                    >
                        Load More
                        <ChevronRight size={16} className="rotate-90" />
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                        Showing {displayCount} of {items.length} tools
                    </p>
                </div>
            )}
        </div>
    );
}
