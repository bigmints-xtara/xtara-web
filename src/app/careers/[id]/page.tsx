"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
    Timer, DollarSign, Briefcase, ChevronRight, GraduationCap,
    ArrowLeft, Share2, BookOpen, Users, TrendingUp, AlertTriangle,
    CheckCircle, Rocket, Grid
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { updatePursuingCareer } from "@/lib/firebase/profile-service";
import CareerTabs from "@/components/careers/CareerTabs";
import LearnSection from "@/components/careers/sections/LearnSection";
import ConnectSection from "@/components/careers/sections/ConnectSection";
import GrowSection from "@/components/careers/sections/GrowSection";
import RelatedCareersCard from "@/components/careers/sidebar/RelatedCareersCard";
import WhatYouDoCard from "@/components/careers/sidebar/WhatYouDoCard";
import SalaryInsightsCard from "@/components/careers/sidebar/SalaryInsightsCard";
import SlideshowOverlay from "@/components/career-path/SlideshowOverlay";
import { generateSlidesFromCareer } from "@/lib/career-slides-utils";
import { useCareerPathQuery } from "@/lib/query/useCareerPath";


export default function CareerDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState("learn");
    const { data: careerPath, isLoading: loading } = useCareerPathQuery(id as string);
    const [switching, setSwitching] = useState(false);
    const [switchError, setSwitchError] = useState<string | null>(null);
    const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

    // Check if this is the currently pursuing career
    const isPursuing = useMemo(() => {
        return userProfile?.pursuingCareer === careerPath?.id;
    }, [userProfile?.pursuingCareer, careerPath?.id]);

    const handleSwitchCareer = async () => {
        if (!user || !careerPath?.id) return;

        // Confirmation dialog (browser native for simplicity, can be custom modal later)
        if (!window.confirm(`Are you sure you want to switch your pursuing career to "${careerPath?.title}"? This will become your primary career path.`)) {
            return;
        }

        setSwitching(true);
        setSwitchError(null);
        try {
            await updatePursuingCareer(user.uid, careerPath.id);
            window.location.reload(); // Reload to reflect changes in context/profile
        } catch (error) {
            console.error("Error switching career", error);
            setSwitchError("Failed to switch career. Please try again.");
            setSwitching(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!careerPath) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center flex-col gap-4">
                <h2 className="text-xl font-bold text-gray-900">Career path not found</h2>
                <button onClick={() => router.back()} className="text-blue-600 hover:underline">Go Back</button>
            </div>
        );
    }

    // Colors matching Flutter app theme roughly
    // Migrated to native shadcn tokens, managed via globals.css and utility classes
    const themeColors = {
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Hero Section - Full Width Gradient */}
            <header className="bg-primary text-primary-foreground py-12">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* Back Link */}
                    <button onClick={() => router.back()} className="flex items-center text-primary-foreground/70 hover:text-primary-foreground transition-colors mb-8 group">
                        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>

                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <div className="px-3 py-1 bg-secondary rounded-lg text-secondary-foreground font-bold text-sm">
                                Role to explore
                            </div>

                            {/* Archetypes */}
                            {careerPath.archetypes?.map((arch) => (
                                <span key={arch} className="px-3 py-1 bg-accent/20 border border-accent/30 text-accent font-bold rounded-full uppercase tracking-wider">
                                    {arch}
                                </span>
                            ))}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4 leading-tight">{careerPath.title}</h1>
                        {careerPath.dreamTitle && (
                            <h2 className="text-xl md:text-2xl text-accent font-medium mb-6">{careerPath.dreamTitle}</h2>
                        )}
                        <p className="text-lg text-primary-foreground/90 leading-relaxed mb-8 max-w-3xl">{careerPath.description}</p>

                        {careerPath.quote && (
                            <blockquote className="border-l-4 border-accent pl-4 italic text-primary-foreground/80 mb-8 max-w-2xl">
                                &ldquo;{careerPath.quote}&rdquo;
                            </blockquote>
                        )}

                        <div className="flex flex-wrap gap-4 items-center">
                            {/* Logic matched with Flutter: Hide button if already pursuing or anonymous */}
                            {!isPursuing && user && !user.isAnonymous && (
                                <button
                                    onClick={handleSwitchCareer}
                                    disabled={switching}
                                    className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-colors  shadow-sky-900/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {switching ? "Switching..." : <><Rocket size={20} /> Switch to this Career</>}
                                </button>
                            )}

                            <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-colors flex items-center gap-2">
                                <Share2 size={18} /> Share
                            </button>
                        </div>
                        {switchError && (
                            <p className="mt-4 text-destructive-foreground text-sm flex items-center gap-2">
                                <AlertTriangle size={16} /> {switchError}
                            </p>
                        )}
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 max-w-7xl pb-20">

                <div className="mt-12">
                    <CareerTabs
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onStartSlideshow={() => setIsSlideshowOpen(true)}
                    />

                    {/* 2-Column Grid: Main Content + Sidebar */}
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content - 2/3 width */}
                        <div className="lg:col-span-2">
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {activeTab === 'learn' && <LearnSection careerPath={careerPath} id={id as string} />}
                                {activeTab === 'connect' && <ConnectSection careerPath={careerPath} id={id as string} />}
                                {activeTab === 'grow' && <GrowSection careerPath={careerPath} id={id as string} />}
                            </div>
                        </div>

                        {/* Sidebar - 1/3 width */}
                        <aside className="space-y-6">
                            <WhatYouDoCard careerPath={careerPath} />
                            <SalaryInsightsCard careerPath={careerPath} />
                            <RelatedCareersCard careerPath={careerPath} />
                        </aside>
                    </div>
                </div>


            </div>

            <Footer />

            <SlideshowOverlay
                isOpen={isSlideshowOpen}
                onClose={() => setIsSlideshowOpen(false)}
                slides={careerPath ? generateSlidesFromCareer(careerPath) : []}
            />
        </div>
    );
}
