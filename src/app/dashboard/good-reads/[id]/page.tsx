"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FirestoreService, GoodRead } from "@/lib/firebase/firestore-service";
import { AchievementsService } from "@/lib/firebase/achievements-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";

export default function GoodReadPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    
    const [goodRead, setGoodRead] = useState<GoodRead | null>(null);
    const [loading, setLoading] = useState(true);
    const [completionSaved, setCompletionSaved] = useState(false);
    const [savingCompletion, setSavingCompletion] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [rewardError, setRewardError] = useState<string | null>(null);
    const automaticAttempted = useRef<string | null>(null);

    const id = params?.id as string;

    useEffect(() => {
        if (!id) return;

        const fetchGoodRead = async () => {
            setLoading(true);
            const data = await FirestoreService.getGoodReadById(id);
            setGoodRead(data);
            setLoading(false);
        };

        fetchGoodRead();
    }, [id]);

    const awardPoints = useCallback(async () => {
        if (!goodRead || !user || user.isAnonymous) return;
        setRewardError(null);
        try {
            const achievements = new AchievementsService();
            const awarded = await achievements.addPointsForGoodRead(user.uid, goodRead.id);
            if (awarded) setTimeout(() => alert("You earned 5 points."), 100);
        } catch (error) {
            console.error("Failed to award Good Read points", error);
            setRewardError("Progress saved. Points could not be updated.");
        }
    }, [goodRead, user]);

    const saveCompletion = useCallback(async () => {
        if (!goodRead || !user || user.isAnonymous || completionSaved || savingCompletion) return;

        setSavingCompletion(true);
        setSaveError(null);
        try {
            await FirestoreService.markGoodReadCompleted(goodRead.id);
            setCompletionSaved(true);
            await awardPoints();
        } catch (error) {
            console.error("Failed to save Good Read completion", error);
            setSaveError("Your progress was not saved.");
        } finally {
            setSavingCompletion(false);
        }
    }, [awardPoints, completionSaved, goodRead, savingCompletion, user]);

    useEffect(() => {
        const attemptKey = goodRead && user ? `${user.uid}:${goodRead.id}` : null;
        if (!goodRead || !user || user.isAnonymous || automaticAttempted.current === attemptKey) return;
        automaticAttempted.current = attemptKey;
        void saveCompletion();
    }, [goodRead, saveCompletion, user]);

    const openFullArticle = () => {
        if (!goodRead?.hyperlink) return;
        window.open(goodRead.hyperlink, "_blank", "noopener,noreferrer");
        if (user && !user.isAnonymous) {
            void FirestoreService.markGoodReadLinkOpened(goodRead.id).catch((error) => {
                console.error("Failed to save Good Read link progress", error);
            });
        }
    };

    if (loading) {
        return (
            <div className="container max-w-3xl mx-auto py-8 px-4 space-y-6">
                <Skeleton className="h-8 w-24 mb-6" />
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    if (!goodRead) {
        return (
            <div className="container max-w-3xl mx-auto py-12 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
                <Button onClick={() => router.push("/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            <Button 
                variant="ghost" 
                className="mb-6 -ml-4" 
                onClick={() => router.push("/dashboard")}
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
            </Button>

            <article className="space-y-8">
                {goodRead.image && (
                    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border">
                        {/* We use standard img to avoid next/image domain config issues for external images */}
                        <img 
                            src={goodRead.image} 
                            alt={goodRead.title}
                            className="object-cover w-full h-full"
                        />
                    </div>
                )}

                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        {goodRead.title}
                    </h1>
                    
                    {goodRead.summary && (
                        <div className="prose dark:prose-invert max-w-none text-muted-foreground text-lg leading-relaxed">
                            {goodRead.summary}
                        </div>
                    )}
                    {saveError && (
                        <div className="mt-4 flex items-center gap-3 text-sm text-destructive" role="alert">
                            <span>{saveError}</span>
                            <Button variant="outline" size="sm" onClick={() => void saveCompletion()} disabled={savingCompletion}>
                                Retry
                            </Button>
                        </div>
                    )}
                    {rewardError && (
                        <div className="mt-4 flex items-center gap-3 text-sm text-destructive" role="alert">
                            <span>{rewardError}</span>
                            <Button variant="outline" size="sm" onClick={() => void awardPoints()}>
                                Retry points
                            </Button>
                        </div>
                    )}
                </div>

                {goodRead.hyperlink && (
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-lg">Continue Reading</h3>
                                <p className="text-sm text-muted-foreground">
                                    Read the full article to dive deeper into this topic.
                                </p>
                            </div>
                            <Button 
                                size="lg" 
                                className="w-full sm:w-auto"
                                onClick={openFullArticle}
                            >
                                Read Full Article
                                <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </article>
        </div>
    );
}
