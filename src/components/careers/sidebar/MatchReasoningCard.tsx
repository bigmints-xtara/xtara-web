"use client";

import { CheckCircle2, Star, Target, Zap } from "lucide-react";
import { CareerPath } from "@/types/career";

interface MatchReasoningCardProps {
    careerPath: CareerPath;
}

export default function MatchReasoningCard({ careerPath }: MatchReasoningCardProps) {
    const reasoning = careerPath.matchReasoning || "This role appeared from signals in your earlier answers. Review the reasoning and gather real evidence before deciding what it means.";

    // Logic from Flutter CareerSlideData.whyCareerFits
    const archetypes = careerPath.archetypes || [];
    const technicalSkills = careerPath.technicalSkills || [];

    const personalityText = archetypes.length > 0
        ? `${archetypes.join(", ")} appeared as work-style clues in your profile.`
        : "Your work-style evidence is still developing.";

    const skillsText = technicalSkills.length > 0
        ? `${technicalSkills.slice(0, 2).join(" and ")} are signals worth testing through real activity.`
        : "More real activity can show which capabilities matter for this role.";

    return (
        <div className="bg-white rounded-2xl p-6  border border-gray-100 overflow-hidden relative">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target size={80} className="text-orange-500" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                        <Star size={20} className="fill-orange-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Why this role appeared</h3>
                </div>

                <div className="mb-6">
                    <p className="text-gray-600 leading-relaxed italic">
                        "{reasoning}"
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 bg-green-100 p-1 rounded-full text-green-600">
                            <CheckCircle2 size={14} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Capability signals</p>
                            <p className="text-sm text-gray-700 font-medium">{skillsText}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="mt-1 bg-blue-100 p-1 rounded-full text-blue-600">
                            <Zap size={14} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Work-style clues</p>
                            <p className="text-sm text-gray-700 font-medium">{personalityText}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                        {archetypes.map((arch) => (
                            <span key={arch} className="px-2 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded uppercase tracking-widest border border-gray-100">
                                {arch}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
