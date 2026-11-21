"use client";


import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useCareerPathQuery } from "@/lib/query/useCareerPath";

interface CareerHubLayoutProps {
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string; // e.g., "text-blue-400"
    bgClass: string; // e.g., "bg-blue-500/10"
    hideHeader?: boolean;
    children: React.ReactNode;
}

export default function CareerHubLayout({
    title, subtitle, description, icon,
    colorClass, bgClass, children, hideHeader = false
}: CareerHubLayoutProps) {
    const { id } = useParams();
    const router = useRouter();
    const { data: careerPath, isLoading: loading } = useCareerPathQuery(id as string);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172c] text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!careerPath && !loading) {
        return (
            <div className="min-h-screen bg-[#0f172c] text-white flex items-center justify-center flex-col gap-4">
                <h2 className="text-xl font-bold">Career path not found</h2>
                <Button variant="ghost" onClick={() => router.push('/')} >Return Home</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172c] text-white">
            <Navbar />

            <div className="container mx-auto max-w-5xl p-6 md:p-8 pb-20">
                {/* Breadcrumb nav */}
                <Button variant="ghost"
                    onClick={() => router.push(`/careers/${id}`)}
                    className="mb-8"
                >
                    <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to {careerPath?.title}
                </Button>

                {/* Header */}
                {!hideHeader && (
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 border-b border-white/10 pb-12">
                        <div className={`p-6 rounded-2xl ${bgClass} ${colorClass}`}>
                            {icon}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-bold text-white">{title}</h1>
                            </div>
                            <h2 className={`text-xl font-medium ${colorClass} mb-3`}>{subtitle}</h2>
                            <p className="text-gray-400 text-lg max-w-2xl">{description}</p>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-none">
                    {children}
                </div>
            </div>
        </div>
    );
}
