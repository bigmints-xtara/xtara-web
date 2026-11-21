"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCareerPath } from "@/lib/firebase/assessment";
import { generateSlidesFromCareer } from "@/lib/career-slides-utils";
import UniversalSlide from "@/components/career-path/UniversalSlide";
import { SlideshowData } from "@/types/career";
import { motion, AnimatePresence } from "framer-motion";

export default function CareerResultsPage() {
    const { id } = useParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [slideshowData, setSlideshowData] = useState<SlideshowData | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    useEffect(() => {
        async function loadCareerPath() {
            if (!id) return;

            // DEBUG MOCK for Verification
            if (id === 'debug-mock') {
                setTimeout(() => {
                    const mockCareerData = {
                        title: "Technical Writer",
                        whatYouDo: "Help create clear and helpful documentation",
                        whyItMatters: "Make technology more accessible to everyone",
                        matchScore: 95,
                        streamSuggestions: ["Arts", "humanities"],
                        expectedSalaryRange: "₹4-10 LPA",
                        matchReasoning: "You enjoy writing and explaining complex topics.",
                        archetypes: ["Organized", "Detail-oriented"],
                        careerPathway: [
                            { title: "Junior Writer", duration: "0-2 years", note: "Learn basics" },
                            { title: "Writer", duration: "2-5 years", note: "Independent work" },
                            { title: "Senior Writer", duration: "5+ years", note: "Lead projects" }
                        ],
                        internshipExamples: [
                            { company: "Google", role: "Docs Intern" },
                            { company: "Microsoft", role: "Content Intern" }
                        ],
                        onlineTrainings: [
                            { platform: "Google", title: "Tech Writing One", price: "Free", note: "Best start" }
                        ],
                        topInstitutions: [{ title: "IIT Madras" }],
                        relatedCareers: [{ title: "UX Writer" }],
                        toolsAndSoftware: [{ title: "VS Code" }]
                    };

                    setSlideshowData({ slides: generateSlidesFromCareer(mockCareerData) });
                    setLoading(false);
                }, 1000);
                return;
            }

            try {
                setLoading(true);
                const data = await getCareerPath(id as string);

                if (!data) {
                    setError("Career path not found.");
                    setLoading(false);
                    return;
                }

                const generatedSlides = generateSlidesFromCareer(data);
                setSlideshowData({ slides: generatedSlides });
                setLoading(false);

            } catch (err) {
                console.error(err);
                setError("Failed to load career recommendations.");
                setLoading(false);
            }
        }

        loadCareerPath();
    }, [id]);

    const nextSlide = () => {
        if (slideshowData && currentSlideIndex < slideshowData.slides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
        } else {
            // Finished
            router.push('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#12192E] text-white flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-semibold">Generating your career path...</h2>
                <p className="text-gray-400 mt-2">This may take a moment.</p>
            </div>
        );
    }

    if (error || !slideshowData) {
        return (
            <div className="min-h-screen bg-[#12192E] text-white flex flex-col items-center justify-center p-4">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold mb-2 text-red-400">Error</h2>
                <p className="text-gray-400 mt-2">{error || "Something went wrong"}</p>
                <Button onClick={() => window.location.reload()} className="mt-8">Retry</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#12192E] text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20 pointer-events-none" />

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20">
                <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentSlideIndex + 1) / slideshowData.slides.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlideIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full pt-12"
                >
                    <UniversalSlide
                        slideData={slideshowData.slides[currentSlideIndex]}
                        onButtonClick={nextSlide}
                        isLastSlide={currentSlideIndex === slideshowData.slides.length - 1}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
