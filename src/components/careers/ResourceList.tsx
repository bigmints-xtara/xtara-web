"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export interface ResourceItem {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    tag?: string;
    link?: string;
    icon?: any;
    type?: 'course' | 'scholarship' | 'training' | 'tool';
    [key: string]: any;
}

interface ResourceListProps {
    items: ResourceItem[];
    emptyMessage?: string;
    onItemClick?: (item: ResourceItem) => void;
}

export default function ResourceList({ items, emptyMessage = "No items available.", onItemClick }: ResourceListProps) {
    if (items.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {items.map((item) => (
                <Button variant="surface"
                    key={item.id}
                    onClick={() => onItemClick?.(item)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 flex items-center gap-3 group"
                >
                    <div className="flex-1 min-w-0">
                        {/* Title - Line 1 */}
                        <div className="font-semibold text-gray-900 text-sm">
                            {item.title}
                        </div>

                        {/* Subtitle - Line 2 */}
                        {item.subtitle && (
                            <div className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                                {item.subtitle}
                            </div>
                        )}
                    </div>

                    {/* Chevron on right */}
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                </Button>
            ))}
        </div>
    );
}
