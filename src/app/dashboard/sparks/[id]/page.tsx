"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ContentService, Spark, SparkSlide } from "@/lib/api/content";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export default function SparkLearningPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [spark, setSpark] = useState<Spark | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [slides, setSlides] = useState<SparkSlide[]>([]);

    useEffect(() => {
        if (!id) return;

        const fetchSpark = async () => {
            setLoading(true);
            const data = await ContentService.getSparkById(id);
            if (data) {
                setSpark(data);
                
                // Construct slides array dynamically based on what's available
                const availableSlides: SparkSlide[] = [];
                if (data.content && Array.isArray(data.content)) {
                    data.content.forEach(lesson => {
                        if (lesson.slides && Array.isArray(lesson.slides)) {
                            availableSlides.push(...lesson.slides);
                        }
                    });
                }
                setSlides(availableSlides);
            }
            setLoading(false);
        };

        fetchSpark();
    }, [id]);

    if (loading) {
        return (
            <div className="container max-w-2xl mx-auto py-12 px-4 space-y-8">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-64 w-full rounded-2xl" />
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
        );
    }

    if (!spark || slides.length === 0) {
        return (
            <div className="container max-w-3xl mx-auto py-12 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Spark Not Found</h1>
                <Button onClick={() => router.push("/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    const currentSlide = slides[currentSlideIndex];
    const isLastSlide = currentSlideIndex === slides.length - 1;
    const progress = ((currentSlideIndex + 1) / slides.length) * 100;

    return (
        <div className="container max-w-2xl mx-auto py-8 px-4 flex flex-col min-h-[80vh]">
            <div className="flex items-center justify-between mb-8">
                <Button 
                    variant="ghost" 
                    size="sm"
                    className="-ml-4" 
                    onClick={() => router.push("/dashboard")}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div className="text-sm font-medium text-muted-foreground">
                    Slide {currentSlideIndex + 1} of {slides.length}
                </div>
            </div>

            <Progress value={progress} className="h-2 mb-8" />

            <div className="flex-1 flex flex-col justify-center">
                <Card className="border-2 shadow-lg">
                    <CardContent className="p-8 md:p-12 space-y-6">
                        {currentSlide.image && (
                            <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden mb-8">
                                <img 
                                    src={currentSlide.image} 
                                    alt={currentSlide.title || "Slide Image"}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        )}
                        
                        {(currentSlide.title || currentSlide.type) && (
                            <h2 className="text-2xl md:text-3xl font-bold text-center capitalize">
                                {currentSlide.title || currentSlide.type}
                            </h2>
                        )}

                        {currentSlide.content && (
                            <div className="prose dark:prose-invert max-w-none text-lg text-center leading-relaxed">
                                {currentSlide.content}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between mt-12">
                <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentSlideIndex === 0}
                >
                    Previous
                </Button>

                {!isLastSlide ? (
                    <Button 
                        size="lg"
                        onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                    >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                ) : (
                    <Button 
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => router.push(`/dashboard/sparks/${spark.id}/quiz`)}
                    >
                        Take Quiz
                        <BookOpen className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
