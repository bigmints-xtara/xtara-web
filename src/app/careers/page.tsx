"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserCareerPaths } from "@/lib/firebase/career-helpers";
import { CareerPath } from "@/types/career";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles, Briefcase, ChevronRight } from "lucide-react";

export default function CareerPathsPage() {
    const { user } = useAuth();
    const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPaths = async () => {
            if (user) {
                setLoading(true);
                const paths = await getUserCareerPaths(user.uid);
                setCareerPaths(paths);
                setLoading(false);
            } else {
                setLoading(false);
            }
        };

        fetchPaths();
    }, [user]);

    const featuredPath = careerPaths.length > 0 ? careerPaths[0] : null;
    const otherPaths = careerPaths.length > 0 ? careerPaths.slice(1) : [];

    return (
        <div className="min-h-screen bg-[#12192E] text-white">
            <Navbar />

            <main className="container mx-auto max-w-7xl p-6 md:p-8 pb-20">
                {/* Header */}
                <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-3 flex items-center gap-3">
                            <Compass className="text-blue-400" size={32} />
                            Career Library
                        </h1>
                        <p className="text-gray-400 max-w-xl">
                            Explore career paths tailored to your interests and skills. Discover your future today.
                        </p>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center py-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : !user ? (
                    <div className="text-center py-20 bg-[#1e2746] border border-white/10 rounded-2xl">
                        <p className="text-gray-400 mb-6 text-lg">Please log in to view your career recommendations.</p>
                        <Link href="/login" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors inline-block">
                            Login to Account
                        </Link>
                    </div>
                ) : careerPaths.length === 0 ? (
                    <div className="text-center py-20 bg-[#1e2746] border border-white/10 rounded-2xl">
                        <p className="text-gray-400 mb-6 text-lg">No career paths found for your profile yet.</p>
                        <p className="text-gray-500 mb-8">Complete the career assessment to get personalized recommendations.</p>
                        <Link href="/" className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors inline-block">
                            Go to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-12">

                        {/* Featured / Top Recommendation */}
                        {featuredPath && (
                            <section>
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Sparkles className="text-yellow-400" size={20} />
                                    Top Recommendation
                                </h2>
                                <Link href={`/careers/${featuredPath.id}`} className="group block">
                                    <div className="bg-gradient-to-r from-blue-900/40 to-[#1e2746] hover:from-blue-900/60 transition-all border border-blue-500/30 rounded-3xl p-8 md:p-10 relative overflow-hidden group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                                        <div className="relative z-10 max-w-3xl">
                                            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full mb-4">ROLE TO EXPLORE</span>
                                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 group-hover:text-blue-100 transition-colors">{featuredPath.title}</h3>
                                            <p className="text-gray-300 text-lg leading-relaxed mb-8 line-clamp-3">{featuredPath.description}</p>

                                            <div className="flex items-center text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
                                                Explore Career Path <ArrowRight className="ml-2" size={20} />
                                            </div>
                                        </div>
                                        {/* Decorative Blob */}
                                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                                    </div>
                                </Link>
                            </section>
                        )}

                        {/* Other Recommendations Grid */}
                        {otherPaths.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-white mb-6">More for You</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {otherPaths.map((path) => (
                                        <Link key={path.id} href={`/careers/${path.id}`} className="group h-full">
                                            <div className="bg-[#1e2746] hover:bg-[#252f54] border border-white/10 hover:border-blue-500/30 rounded-2xl p-6 h-full flex flex-col transition-all hover:-translate-y-1 hover:">
                                                <div className="mb-4">
                                                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                                        <Briefcase size={24} />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{path.title}</h3>
                                                    <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">{path.description}</p>
                                                </div>
                                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                                                    <span className="text-gray-500">View path details</span>
                                                    <ChevronRight className="text-gray-500 group-hover:text-blue-400 transition-colors" size={16} />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
