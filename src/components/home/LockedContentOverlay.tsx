"use client";

import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

interface LockedContentOverlayProps {
    message?: string;
    careerPathId?: string;
}

export default function LockedContentOverlay({
    message = "Sign up to unlock",
    careerPathId
}: LockedContentOverlayProps) {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const signupUrl = careerPathId
            ? `/signup?careerPathId=${careerPathId}`
            : '/signup';
        router.push(signupUrl);
    };

    return (
        <div
            onClick={handleClick}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-10 rounded-2xl"
        >
            <div className="p-4 bg-white/10 rounded-full backdrop-blur-md transform group-hover:scale-110 transition-transform duration-300">
                <Lock size={32} className="text-white" />
            </div>
            <p className="text-white font-bold text-lg px-4 text-center">{message}</p>
            <Button >
                Sign Up Free
            </Button>
        </div>
    );
}
