"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ContentService, Spark, SparkKnowledgeCheck } from "@/lib/api/content";
import { AchievementsService } from "@/lib/firebase/achievements-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Trophy, Award, Zap } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function SparkQuizPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const id = params?.id as string;

    const [spark, setSpark] = useState<Spark | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    // Results state
    const [score, setScore] = useState(0);
    const [isPerfect, setIsPerfect] = useState(false);
    const [earnedPoints, setEarnedPoints] = useState(0);
    const [pointsAwarded, setPointsAwarded] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [rewardError, setRewardError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const fetchSpark = async () => {
            setLoading(true);
            const data = await ContentService.getSparkById(id);
            setSpark(data);
            setLoading(false);
        };
        fetchSpark();
    }, [id]);

    const questions: SparkKnowledgeCheck[] = [];
    if (spark?.content && Array.isArray(spark.content)) {
        spark.content.forEach(lesson => {
            if (lesson.knowledge_check && Array.isArray(lesson.knowledge_check)) {
                questions.push(...lesson.knowledge_check);
            }
        });
    }
    if (questions.length === 0 && spark?.lessons) {
        spark.lessons.forEach((lesson) => questions.push(...(lesson.knowledge_check || [])));
    }
    if (questions.length === 0 && spark?.knowledgeChecks) {
        questions.push(...spark.knowledgeChecks);
    }
    const currentQuestion = questions[currentQuestionIndex];

    const handleSelectOption = (optionIndex: number) => {
        if (isSubmitted) return;
        setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!spark || !user || user.isAnonymous) return;
        
        let correctCount = 0;
        questions.forEach((q, idx) => {
            if (
                selectedAnswers[idx] === q.correctOptionIndex ||
                q.options[selectedAnswers[idx]] === q.correct_answer
            ) {
                correctCount++;
            }
        });

        const perfect = correctCount === questions.length;
        const calculatedScore = correctCount * (spark.rewardPerQuestion || 2);
        const medalBonus = perfect ? (spark.medalPoints || 0) : 0;
        const finalTotal = calculatedScore + medalBonus;

        setSubmitting(true);
        setSaveError(null);
        try {
            await ContentService.markSparkCompleted(spark.id);
            let awarded = false;
            try {
                const achievements = new AchievementsService();
                awarded = await achievements.addPointsForSpark(
                    user.uid,
                    spark.id,
                    calculatedScore,
                    perfect,
                    medalBonus,
                    spark.title
                );
            } catch (error) {
                console.error("Spark completion saved but points failed", error);
                setRewardError("Result saved. Points could not be updated.");
            }

            setScore(correctCount);
            setIsPerfect(perfect);
            setPointsAwarded(awarded);
            setEarnedPoints(awarded ? finalTotal : 0);
            setIsSubmitted(true);

            if (perfect && awarded) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        } catch (error) {
            console.error("Failed to save Spark completion", error);
            setSaveError("Your result was not saved. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const retryPoints = async () => {
        if (!spark || !user || user.isAnonymous) return;
        setRewardError(null);
        try {
            const calculatedScore = score * (spark.rewardPerQuestion || 2);
            const medalBonus = isPerfect ? (spark.medalPoints || 0) : 0;
            const achievements = new AchievementsService();
            await achievements.addPointsForSpark(
                user.uid,
                spark.id,
                calculatedScore,
                isPerfect,
                medalBonus,
                spark.title,
            );
            setPointsAwarded(true);
            setEarnedPoints(calculatedScore + medalBonus);
        } catch (error) {
            console.error("Failed to retry Spark points", error);
            setRewardError("Result saved. Points could not be updated.");
        }
    };

    if (loading) {
        return (
            <div className="container max-w-2xl mx-auto py-12 px-4 space-y-8">
                <Skeleton className="h-8 w-1/3 mb-8" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        );
    }

    if (!spark || questions.length === 0) {
        return (
            <div className="container max-w-3xl mx-auto py-12 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Quiz Not Found or Empty</h1>
                <Button onClick={() => router.push("/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="container max-w-2xl mx-auto py-12 px-4 text-center space-y-8">
                <div className="flex justify-center mb-6">
                        {isPerfect && pointsAwarded ? (
                        <div className="p-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                            <Trophy className="h-20 w-20 text-yellow-500" />
                        </div>
                    ) : (
                        <div className="p-6 bg-primary/10 rounded-full">
                            <CheckCircle2 className="h-20 w-20 text-primary" />
                        </div>
                    )}
                </div>

                <h1 className="text-4xl font-bold">Quiz Completed!</h1>
                
                <div className="bg-card border rounded-2xl p-8 space-y-6">
                    <div className="text-xl font-medium">
                        You scored {score} out of {questions.length}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl">
                            <Zap className="h-8 w-8 text-blue-500 mb-2" />
                            <div className="text-2xl font-bold">+{pointsAwarded ? score * (spark.rewardPerQuestion || 2) : 0}</div>
                            <div className="text-sm text-muted-foreground">Base Points</div>
                        </div>
                        
                        {pointsAwarded && isPerfect && spark.medalPoints && spark.medalPoints > 0 && (
                            <div className="flex flex-col items-center p-4 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                                <Award className="h-8 w-8 text-yellow-500 mb-2" />
                                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">+{spark.medalPoints}</div>
                                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-500">Medal Bonus</div>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-4 border-t">
                        <div className="text-lg text-muted-foreground">Total Earned</div>
                        <div className="text-5xl font-black text-primary mt-2">{earnedPoints} pt</div>
                    </div>
                    {!pointsAwarded && !rewardError && (
                        <p className="text-sm text-muted-foreground">Already completed. No extra points.</p>
                    )}
                    {rewardError && (
                        <div className="space-y-3 text-sm text-destructive" role="alert">
                            <p>{rewardError}</p>
                            <Button variant="outline" size="sm" onClick={() => void retryPoints()}>
                                Retry points
                            </Button>
                        </div>
                    )}
                </div>

                <div className="pt-8">
                    <Button size="lg" className="w-full sm:w-auto" onClick={() => router.push("/dashboard")}>
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto py-8 px-4 flex flex-col min-h-[80vh]">
            <div className="flex items-center justify-between mb-8">
                <Button 
                    variant="ghost" 
                    size="sm"
                    className="-ml-4" 
                    onClick={() => router.push(`/dashboard/sparks/${spark.id}`)}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Spark
                </Button>
                <div className="text-sm font-medium text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {questions.length}
                </div>
            </div>

            <Card className="flex-1 border-2 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl leading-relaxed">
                        {currentQuestion.question}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    {currentQuestion.options.map((option, idx) => {
                        const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleSelectOption(idx)}
                                className={cn(
                                    "w-full p-4 text-left rounded-xl border-2 transition-all duration-200",
                                    isSelected 
                                        ? "border-primary bg-primary/5 shadow-sm" 
                                        : "border-border hover:border-primary/50 hover:bg-accent"
                                )}
                            >
                                <div className="flex items-center">
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4",
                                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                    )}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <span className={cn("text-lg", isSelected && "font-medium")}>
                                        {option}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </CardContent>
            </Card>

            <div className="flex items-center justify-between mt-8">
                <Button 
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                >
                    Previous
                </Button>

                {currentQuestionIndex < questions.length - 1 ? (
                    <Button 
                        onClick={handleNext}
                        disabled={selectedAnswers[currentQuestionIndex] === undefined}
                    >
                        Next Question
                    </Button>
                ) : (
                    <Button 
                        className="bg-primary"
                        onClick={handleSubmit}
                        disabled={submitting || Object.keys(selectedAnswers).length < questions.length}
                    >
                        {submitting ? "Saving…" : "Submit Quiz"}
                    </Button>
                )}
            </div>
            {saveError && <p className="mt-3 text-sm text-destructive" role="alert">{saveError}</p>}
        </div>
    );
}
