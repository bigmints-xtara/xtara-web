"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, Users, TrendingUp, Play } from "lucide-react";

interface TabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onStartSlideshow?: () => void;
}

export default function CareerTabs({ activeTab, setActiveTab, onStartSlideshow }: TabsProps) {
    const tabs = [
        { id: "learn", label: "Learn", icon: <BookOpen size={18} /> },
        { id: "connect", label: "Connect", icon: <Users size={18} /> },
        { id: "grow", label: "Grow", icon: <TrendingUp size={18} /> },
    ];

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                            relative flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-all duration-300 z-10 rounded-lg whitespace-nowrap
                            ${isActive ? "text-white" : "text-gray-500 hover:text-blue-600"}
                        `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabPill"
                                    className="absolute inset-0 bg-blue-600 rounded-lg  shadow-blue-500/20"
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                />
                            )}
                            <span className="relative z-20 flex items-center gap-2">
                                {tab.icon}
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {onStartSlideshow && (
                <Button
                  onClick={onStartSlideshow}
                >
                    <Play size={16} fill="currentColor" />
                    Start Slideshow
                </Button>
            )}
        </div>
    );
}
