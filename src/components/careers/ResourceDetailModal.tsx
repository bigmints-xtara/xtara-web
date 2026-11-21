"use client";

import { Button } from "@/components/ui/button";
import { X, MapPin, ChevronRight, Loader2, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { ResourceItem } from "./ResourceList";
import { useAuth } from "@/context/AuthContext";
import { CollegeInfo, CollegeService } from "@/lib/firebase/college-service";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ResourceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: ResourceItem | null;
}

export default function ResourceDetailModal({ isOpen, onClose, item }: ResourceDetailModalProps) {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [allColleges, setAllColleges] = useState<CollegeInfo[]>([]);
    const [cityColleges, setCityColleges] = useState<CollegeInfo[]>([]);
    const [stateColleges, setStateColleges] = useState<CollegeInfo[]>([]);
    const [outsideColleges, setOutsideColleges] = useState<CollegeInfo[]>([]);
    const [loadingColleges, setLoadingColleges] = useState(false);
    const [locationFilter, setLocationFilter] = useState<'all' | 'city' | 'state' | 'outside'>('all');

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden"; // Prevent background scroll
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    // Fetch colleges when item is a course
    useEffect(() => {
        if (isOpen && item?.type === 'course') {
            const fetchColleges = async () => {
                setLoadingColleges(true);
                try {
                    // Use clean stream name stored in originalData for search if available
                    const searchQuery = item.originalData?.streamNameForSearch ||
                        item.originalData?.selectedStream?.display_course_name ||
                        item.originalData?.selectedStream?.course_name ||
                        item.title;

                    const userCity = userProfile?.city || '';
                    const userState = userProfile?.state || '';

                    console.log('🔍 [ResourceModal] Searching for:', searchQuery);
                    console.log('🔍 [ResourceModal] User location:', userCity, userState);

                    // Use new location hierarchy search
                    const results = await CollegeService.searchCollegesByLocationHierarchy(
                        searchQuery,
                        userCity,
                        userState
                    );

                    setAllColleges(results.all);
                    setCityColleges(results.city);
                    setStateColleges(results.state);
                    setOutsideColleges(results.outside);
                } catch (error) {
                    console.error("Error fetching colleges:", error);
                } finally {
                    setLoadingColleges(false);
                }
            };
            fetchColleges();
        } else {
            setAllColleges([]);
            setCityColleges([]);
            setStateColleges([]);
            setOutsideColleges([]);
            setLocationFilter('all');
        }
    }, [isOpen, item, userProfile]);

    if (!isOpen || !item) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl  max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Dark Blue */}
                <div className="sticky top-0 bg-[#1e3a8a] text-white p-6 rounded-t-2xl flex items-start justify-between">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-2">
                            {item.icon && (
                                <div className="p-2 bg-white/10 rounded-lg">
                                    {item.icon}
                                </div>
                            )}
                            <div>
                                {item.tag && (
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-1 block">
                                        {item.tag}
                                    </span>
                                )}
                                <h2 className="text-2xl font-bold">{item.title}</h2>
                            </div>
                        </div>
                        {item.subtitle && (
                            <p className="text-blue-100 font-medium">{item.subtitle}</p>
                        )}
                    </div>
                    <Button variant="ghost" size="icon"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </Button>
                </div>

                {/* Content - White Background */}
                <div className="p-6 text-gray-800">
                    {item.description && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                        </div>
                    )}

                    {/* Additional fields from originalData */}
                    {item.originalData && (
                        <div className="space-y-4">
                            {item.originalData.details && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Details</h3>
                                    <p className="text-gray-700 leading-relaxed">{item.originalData.details}</p>
                                </div>
                            )}

                            {item.originalData.duration && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-600 mb-1">Duration</h3>
                                    <p className="text-gray-700">{item.originalData.duration}</p>
                                </div>
                            )}

                            {item.originalData.examMode && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-600 mb-1">Exam Mode</h3>
                                    <p className="text-gray-700">{item.originalData.examMode}</p>
                                </div>
                            )}

                            {item.originalData.provider && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-600 mb-1">Provider</h3>
                                    <p className="text-gray-700">{item.originalData.provider}</p>
                                </div>
                            )}

                            {item.originalData.amount && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-600 mb-1">Amount</h3>
                                    <p className="text-gray-700">{item.originalData.amount}</p>
                                </div>
                            )}

                            {/* Scholarship-specific fields */}
                            {item.originalData.eligibility && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-600 mb-1">Eligibility</h3>
                                    <p className="text-gray-700 leading-relaxed">{item.originalData.eligibility}</p>
                                </div>
                            )}

                            {item.originalData.type && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-600 mb-1">Type</h3>
                                    <p className="text-gray-700">{item.originalData.type}</p>
                                </div>
                            )}

                            {item.originalData.level && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-600 mb-1">Level</h3>
                                    <p className="text-gray-700">{item.originalData.level}</p>
                                </div>
                            )}

                            {item.originalData.country && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-600 mb-1">Country</h3>
                                    <p className="text-gray-700">{item.originalData.country}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {item.link && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white font-bold rounded-lg hover:bg-blue-900 transition-colors w-full justify-center"
                            >
                                Visit Resource
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    )}

                    {/* Colleges Section */}
                    {item.type === 'course' && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Colleges Offering This Course</h3>

                            {/* Filter by Location - Flutter Style */}
                            <div className="mb-6">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Filter by Location</p>
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="surface"
                                        onClick={() => setLocationFilter('all')}
                                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${locationFilter === 'all'
                                            ? 'bg-blue-600 text-white '
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <MapPin size={14} /> All ({allColleges.length})
                                    </Button>
                                    <Button variant="surface"
                                        onClick={() => setLocationFilter('city')}
                                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${locationFilter === 'city'
                                            ? 'bg-blue-600 text-white '
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        🏢 In {userProfile?.city || 'Your City'} ({cityColleges.length})
                                    </Button>
                                    <Button variant="surface"
                                        onClick={() => setLocationFilter('state')}
                                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${locationFilter === 'state'
                                            ? 'bg-blue-600 text-white '
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        📍 In {userProfile?.state || 'Your State'} ({stateColleges.length})
                                    </Button>
                                    <Button variant="surface"
                                        onClick={() => setLocationFilter('outside')}
                                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${locationFilter === 'outside'
                                            ? 'bg-blue-600 text-white '
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        🌍 Outside {userProfile?.state || 'Your State'} ({outsideColleges.length})
                                    </Button>
                                </div>
                            </div>

                            {/* Results */}
                            {loadingColleges ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <Loader2 className="animate-spin mb-2" size={32} />
                                    <p className="text-sm">Searching for colleges...</p>
                                </div>
                            ) : (() => {
                                // Get colleges based on selected filter
                                const filteredColleges =
                                    locationFilter === 'all' ? allColleges :
                                        locationFilter === 'city' ? cityColleges :
                                            locationFilter === 'state' ? stateColleges :
                                                outsideColleges;

                                return filteredColleges.length > 0 ? (
                                    <div className="space-y-3">
                                        {filteredColleges.map((college) => (
                                            <Link
                                                key={college.id}
                                                href={`/colleges/${college.id}`}
                                                className="block p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover: hover:border-blue-200 transition-all group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                            <GraduationCap size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                {college.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-500">
                                                                {college.city}, {college.state}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-gray-500 text-sm">No colleges found in this location.</p>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
