"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getAssessmentData } from "@/lib/firebase/profile-service";

// Utility function to format camelCase to readable text
const formatText = (text: string): string => {
    if (!text) return text;
    return text
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase());
};

// Utility to format field names to human-readable labels
const formatFieldName = (fieldName: string): string => {
    return fieldName
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase());
};

// Fields to exclude from dynamic display
const EXCLUDED_FIELDS = [
    'timestamp', 'userId', 'isAnonymous', 'isRetake', 'skippedFields',
    'createdAt', 'updatedAt', 'lastAssessmentUpdate', 'assessmentCompleted',
    'isRetakeAssessment', 'fullName', 'age', 'gender', 'currentGrade',
    'educationBoard', 'currentStream', 'grade12Streams'
];

// Categorize fields for better organization
const CATEGORY_MAPPINGS: Record<string, string[]> = {
    'Interests & Motivations': ['interests', 'exciters', 'hobbies', 'passions'],
    'Strengths & Weaknesses': [
        'strengths', 'weaknesses',
        'grade10Strengths', 'grade10Weaknesses',
        'grade12ScienceStrengths', 'grade12ScienceWeaknesses',
        'grade12CommerceStrengths', 'grade12CommerceWeaknesses',
        'grade12ArtsStrengths', 'grade12ArtsWeaknesses',
        'skills', 'talents',
        'strongSubjects', 'weakSubjects'
    ],
    'Personality Traits': ['personalityTraits', 'personality', 'traits', 'characteristics'],
    'Career Preferences': ['careerGoals', 'careerPreferences', 'workEnvironment', 'workStyle'],
    'Academic Information': ['likedSubjects', 'dislikedSubjects', 'favoriteSubjects', 'subjectPreferences'],
    'Values & Priorities': ['values', 'priorities', 'importantFactors'],
};

export default function AssessmentDataPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [assessmentData, setAssessmentData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (authLoading) return;

            if (!user) {
                router.push("/");
                setLoading(false);
                return;
            }

            try {
                const data = await getAssessmentData(user.uid);
                console.log("Assessment data fetched:", data);
                setAssessmentData(data);
            } catch (error) {
                console.error("Error fetching assessment data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, authLoading, router]);

    const categorizedData = useMemo(() => {
        if (!assessmentData) return null;

        const result: Record<string, Record<string, any>> = {};
        const uncategorized: Record<string, any> = {};

        // Personal info for header
        const personalInfo = {
            fullName: assessmentData.fullName || "Student",
            age: assessmentData.age,
            gender: assessmentData.gender,
            grade: assessmentData.currentGrade,
            stream: assessmentData.currentStream || assessmentData.grade12Streams,
            board: assessmentData.educationBoard,
        };

        // Categorize all fields
        Object.entries(assessmentData).forEach(([key, value]) => {
            if (EXCLUDED_FIELDS.includes(key)) return;
            if (!value) return;

            let categorized = false;
            for (const [category, fields] of Object.entries(CATEGORY_MAPPINGS)) {
                if (fields.includes(key)) {
                    if (!result[category]) result[category] = {};
                    result[category][key] = value;
                    categorized = true;
                    break;
                }
            }

            if (!categorized) {
                uncategorized[key] = value;
            }
        });

        if (Object.keys(uncategorized).length > 0) {
            result['Additional Career Insights'] = uncategorized;
        }

        return { personalInfo, categories: result };
    }, [assessmentData]);

    const renderValue = (value: any) => {
        // Array of strings
        if (Array.isArray(value)) {
            return (
                <ul className="mt-2 space-y-1">
                    {value.map((item: any, idx: number) => (
                        <li key={idx} className="text-gray-700 flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>{typeof item === 'string' ? formatText(item) : JSON.stringify(item)}</span>
                        </li>
                    ))}
                </ul>
            );
        }

        // Object (key-value pairs)
        if (typeof value === 'object' && value !== null) {
            return (
                <div className="mt-2 space-y-1.5 pl-4 border-l-2 border-gray-200">
                    {Object.entries(value).map(([key, val]: [string, any], idx) => (
                        <div key={idx} className="text-sm">
                            <span className="font-medium text-gray-600">{formatFieldName(key)}:</span>{' '}
                            <span className="text-gray-700">{typeof val === 'string' ? formatText(val) : String(val)}</span>
                        </div>
                    ))}
                </div>
            );
        }

        // Simple value
        return <p className="text-gray-700 mt-1">{typeof value === 'string' ? formatText(value) : String(value)}</p>;
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!categorizedData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                        <ArrowLeft size={20} /> Back
                    </Button>
                    <div className="bg-white rounded-xl p-8 text-center">
                        <p className="text-gray-500">No assessment data available. Complete your assessment to view your personalized report.</p>
                    </div>
                </div>
            </div>
        );
    }

    const { personalInfo, categories } = categorizedData;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <Button variant="ghost" onClick={() => router.back()} className="mb-8">
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back to profile</span>
                </Button>

                {/* Simple Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{personalInfo.fullName}</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                        {personalInfo.age && (
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Age:</span>
                                <span className="text-gray-900">{personalInfo.age}</span>
                            </div>
                        )}
                        {personalInfo.gender && (
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Gender:</span>
                                <span className="text-gray-900">{formatText(personalInfo.gender)}</span>
                            </div>
                        )}
                        {personalInfo.grade && (
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Grade:</span>
                                <span className="text-gray-900">
                                    {personalInfo.grade.toString().replace(/grade/i, '').trim() || personalInfo.grade}
                                </span>
                            </div>
                        )}
                        {personalInfo.board && (
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Board:</span>
                                <span className="text-gray-900">{personalInfo.board}</span>
                            </div>
                        )}
                        {personalInfo.stream && (
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Stream:</span>
                                <span className="text-gray-900">
                                    {Array.isArray(personalInfo.stream)
                                        ? personalInfo.stream.map(s => formatText(s)).join(', ')
                                        : formatText(personalInfo.stream)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-12">
                    {Object.entries(categories).map(([categoryName, fields], catIdx) => {
                        const fieldEntries = Object.entries(fields);
                        const showFieldNames = fieldEntries.length > 1;

                        return (
                            <section key={catIdx}>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-200">
                                    {categoryName}
                                </h2>

                                <div className="space-y-6">
                                    {fieldEntries.map(([fieldName, value], fieldIdx) => (
                                        <div key={fieldIdx}>
                                            {showFieldNames && (
                                                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                                                    {formatFieldName(fieldName)}
                                                </h3>
                                            )}
                                            {renderValue(value)}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
