"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useChallengesQuery } from "@/lib/query/useContentQuery";
import { ContentService, Challenge } from "@/lib/api/content";
import { AchievementsService } from "@/lib/firebase/achievements-service";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, BookOpen, ChevronRight } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function ChallengesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const userId = user?.uid;
    const userIsAnonymous = user?.isAnonymous;
    
    const { data: challengesList = [], isLoading: listLoading } = useChallengesQuery(20);
    
    const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [challengeLoading, setChallengeLoading] = useState(false);
    
    // Reading state
    const [hasReadContent, setHasReadContent] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Quiz state
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [isPractice, setIsPractice] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [rewardError, setRewardError] = useState<string | null>(null);

    // Load full challenge details when selected
    useEffect(() => {
        if (!selectedChallengeId) {
            setActiveChallenge(null);
            return;
        }

        const fetchDetails = async () => {
            setChallengeLoading(true);
            setSaveError(null);
            setRewardError(null);
            try {
                const data = await ContentService.getChallengeById(selectedChallengeId);
                let completedBefore = false;
                if (userId && !userIsAnonymous) {
                    try {
                        completedBefore = await ContentService.hasChallengeSubmission(selectedChallengeId);
                    } catch (error) {
                        console.error("Failed to load challenge progress", error);
                        setSaveError("Previous progress could not be loaded.");
                    }
                }
                setActiveChallenge(data);
                setHasReadContent(false);
                setShowQuiz(false);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setIsSubmitted(false);
                setQuizScore(0);
                setIsPractice(completedBefore);
            } finally {
                setChallengeLoading(false);
            }
        };

        fetchDetails();
    }, [selectedChallengeId, userId, userIsAnonymous]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 100;
        if (bottom && !hasReadContent) {
            setHasReadContent(true);
        }
    };

    const handleSelectOption = (optionIndex: number) => {
        if (isSubmitted) return;
        setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
    };

    const handleNextQuestion = () => {
        if (activeChallenge?.questions && currentQuestionIndex < activeChallenge.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const submitQuiz = async () => {
        if (!activeChallenge || !user || user.isAnonymous) return;
        
        let correctCount = 0;
        const questions = activeChallenge.questions || [];
        
        questions.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.correctOptionIndex) {
                correctCount++;
            }
        });

        setSubmitting(true);
        setSaveError(null);
        try {
            await ContentService.submitChallenge(activeChallenge.id, {
                answers: questions.map((_, index) => selectedAnswers[index]),
                score: correctCount,
                isPractice,
            });
            let awarded: boolean | null = null;
            try {
                const achievements = new AchievementsService();
                awarded = await achievements.addPointsForChallenge(user.uid, activeChallenge.id, correctCount, isPractice);
            } catch (error) {
                console.error("Challenge saved but points failed", error);
                setRewardError("Result saved. Points could not be updated.");
            }
            setQuizScore(correctCount);
            setIsSubmitted(true);
            if (awarded === false) setIsPractice(true);
            
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            
            if (awarded === true) {
                alert(`You earned 10 base points + ${correctCount} bonus points!`);
            } else if (awarded === false) {
                alert("Challenge saved.");
            }
        } catch (error) {
            console.error("Failed to save challenge completion", error);
            setSaveError("Your result was not saved. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const retryPoints = async () => {
        if (!activeChallenge || !user || user.isAnonymous) return;
        setRewardError(null);
        try {
            const achievements = new AchievementsService();
            await achievements.addPointsForChallenge(user.uid, activeChallenge.id, quizScore, isPractice);
        } catch (error) {
            console.error("Failed to retry challenge points", error);
            setRewardError("Result saved. Points could not be updated.");
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6">
            {/* LEFT PANEL: Sidebar */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col bg-card border rounded-2xl overflow-hidden shrink-0">
                <div className="p-4 border-b flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="mr-2">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="font-bold text-lg">Reading Challenges</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-3">
                        {listLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-xl" />
                            ))
                        ) : challengesList.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No challenges available right now.
                            </div>
                        ) : (
                            challengesList.map(challenge => (
                                <button
                                    key={challenge.id}
                                    onClick={() => setSelectedChallengeId(challenge.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3",
                                        selectedChallengeId === challenge.id 
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                                            : "border-border hover:border-primary/30 hover:bg-accent/50"
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                                        {challenge.image ? (
                                            <img src={challenge.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <BookOpen className="w-6 h-6 m-3 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{challenge.title}</div>
                                        <div className="text-xs text-primary mt-1 flex items-center">
                                            <Trophy className="w-3 h-3 mr-1" /> 10 pts + bonus
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Content & Quiz */}
            <div className="flex-1 bg-card border rounded-2xl overflow-hidden flex flex-col relative">
                {!selectedChallengeId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                        <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-medium text-foreground mb-2">Select a Challenge</h3>
                        <p>Choose a reading challenge from the sidebar to begin earning points.</p>
                    </div>
                ) : challengeLoading ? (
                    <div className="p-8 space-y-6">
                        <Skeleton className="h-8 w-3/4 mb-4" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                    </div>
                ) : activeChallenge ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b shrink-0 flex items-center justify-between bg-card z-10 shadow-sm">
                            <h2 className="text-2xl font-bold tracking-tight">{activeChallenge.title}</h2>
                            {showQuiz && (
                                <Button variant="outline" size="sm" onClick={() => setShowQuiz(false)}>
                                    Back to Reading
                                </Button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto" onScrollCapture={handleScroll} ref={contentRef}>
                            <div className="p-6 md:p-8 max-w-3xl mx-auto">
                                {!showQuiz ? (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {activeChallenge.image && (
                                            <div className="w-full h-64 rounded-2xl overflow-hidden border">
                                                <img 
                                                    src={activeChallenge.image} 
                                                    alt={activeChallenge.title} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed">
                                            {activeChallenge.content ? (
                                                <div className="whitespace-pre-wrap">{activeChallenge.content}</div>
                                            ) : (
                                                <p className="text-muted-foreground italic">No content available for this challenge.</p>
                                            )}
                                        </div>

                                        <div className="pt-12 pb-8 flex flex-col items-center border-t mt-12">
                                            <h3 className="text-xl font-semibold mb-4">Ready to test your knowledge?</h3>
                                            <Button 
                                                size="lg" 
                                                className="w-full sm:w-auto min-w-[200px]"
                                                disabled={!hasReadContent && (activeChallenge.content?.length || 0) > 500}
                                                onClick={() => {
                                                    setHasReadContent(true);
                                                    setShowQuiz(true);
                                                }}
                                            >
                                                Take the Quiz
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </Button>
                                            {!hasReadContent && (activeChallenge.content?.length || 0) > 500 && (
                                                <p className="text-sm text-muted-foreground mt-3">
                                                    Scroll to the bottom of the content to unlock the quiz.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in slide-in-from-right-8 duration-300">
                                        {!isSubmitted ? (
                                            <div className="space-y-8">
                                                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                                    <span>Question {currentQuestionIndex + 1} of {activeChallenge.questions?.length || 0}</span>
                                                </div>

                                                <h3 className="text-2xl leading-relaxed font-medium">
                                                    {activeChallenge.questions?.[currentQuestionIndex]?.question}
                                                </h3>

                                                <div className="space-y-3">
                                                    {activeChallenge.questions?.[currentQuestionIndex]?.options.map((option, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleSelectOption(idx)}
                                                            className={cn(
                                                                "w-full p-4 text-left rounded-xl border-2 transition-all duration-200",
                                                                selectedAnswers[currentQuestionIndex] === idx 
                                                                    ? "border-primary bg-primary/5" 
                                                                    : "border-border hover:border-primary/50 hover:bg-accent"
                                                            )}
                                                        >
                                                            <div className="flex items-center">
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4",
                                                                    selectedAnswers[currentQuestionIndex] === idx ? "border-primary bg-primary" : "border-muted-foreground"
                                                                )}>
                                                                    {selectedAnswers[currentQuestionIndex] === idx && <div className="w-2 h-2 rounded-full bg-white" />}
                                                                </div>
                                                                <span className="text-lg">{option}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between pt-8 border-t">
                                                    <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
                                                        Previous
                                                    </Button>

                                                    {currentQuestionIndex < (activeChallenge.questions?.length || 1) - 1 ? (
                                                        <Button 
                                                            onClick={handleNextQuestion}
                                                            disabled={selectedAnswers[currentQuestionIndex] === undefined}
                                                        >
                                                            Next
                                                        </Button>
                                                    ) : (
                                                        <Button 
                                                            onClick={submitQuiz}
                                                            disabled={submitting || Object.keys(selectedAnswers).length < (activeChallenge.questions?.length || 0)}
                                                        >
                                                            {submitting ? "Saving…" : "Submit Challenge"}
                                                        </Button>
                                                    )}
                                                </div>
                                                {saveError && <p className="text-sm text-destructive" role="alert">{saveError}</p>}
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-8 py-8">
                                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
                                                    <Trophy className="w-12 h-12 text-primary" />
                                                </div>
                                                <h2 className="text-3xl font-bold">Challenge Completed!</h2>
                                                
                                                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                                                    <div className="p-4 border rounded-xl bg-card">
                                                        <div className="text-sm text-muted-foreground mb-1">Base Points</div>
                                                        <div className="text-3xl font-bold text-primary">{isPractice ? 0 : 10}</div>
                                                    </div>
                                                    <div className="p-4 border rounded-xl bg-card">
                                                        <div className="text-sm text-muted-foreground mb-1">Quiz Bonus</div>
                                                        <div className="text-3xl font-bold text-primary">{isPractice ? 0 : quizScore}</div>
                                                    </div>
                                                </div>

                                                {isPractice && (
                                                    <p className="text-muted-foreground">Practice runs do not award additional points.</p>
                                                )}
                                                {rewardError && (
                                                    <div className="space-y-3 text-sm text-destructive" role="alert">
                                                        <p>{rewardError}</p>
                                                        <Button variant="outline" size="sm" onClick={() => void retryPoints()}>
                                                            Retry points
                                                        </Button>
                                                    </div>
                                                )}

                                                <div className="pt-8">
                                                    <Button onClick={() => router.push("/dashboard")}>
                                                        Return to Dashboard
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
