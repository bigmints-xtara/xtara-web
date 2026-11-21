"use client";

import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Search, Globe, FileText, GraduationCap, CheckCircle } from "lucide-react";
import CareerHubLayout from "@/components/careers/CareerHubLayout";

export default function ScholarshipDetailPage() {
    const searchParams = useSearchParams();
    const dataString = searchParams.get("data");
    // Parse the item. Not specifically typed here but we know the structure from LearnSection
    const item = dataString ? JSON.parse(decodeURIComponent(dataString)) : null;

    if (!item) {
        return <div className="p-8 text-white">Scholarship data not found.</div>;
    }

    const { originalData } = item;

    return (
        <CareerHubLayout
            title="Scholarship Details"
            subtitle=""
            description=""
            icon={<Search size={32} />}
            colorClass="text-orange-400"
            bgClass="bg-orange-500" // Header background
            hideHeader={true} // Custom header look matching the screenshot
        >
            <div className="bg-orange-500 p-8 rounded-b-3xl -mt-6 mb-8 text-white relative">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <Search size={40} className="text-white" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-center mb-2">{item.title}</h1>
                <p className="text-center text-orange-100 font-medium">({originalData?.abbr || "Scholarship"})</p>
            </div>

            <div className="space-y-6 px-2">

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Scholarship Information</h2>
                    <Button variant="outline" >Details</Button>
                </div>

                <div className="bg-[#1e293b] rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-start gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Globe size={20} /></div>
                        <div>
                            <span className="block text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">Type</span>
                            <span className="text-white font-medium">{originalData?.type || "Government"}</span>
                        </div>
                    </div>
                    <div className="p-4 border-b border-white/5 flex items-start gap-4">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><CheckCircle size={20} /></div>
                        <div>
                            <span className="block text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">Eligibility</span>
                            <span className="text-white font-medium text-sm leading-relaxed">{originalData?.eligibility || "Students enrolled in relevant streams."}</span>
                        </div>
                    </div>
                    <div className="p-4 flex items-start gap-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><GraduationCap size={20} /></div>
                        <div>
                            <span className="block text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">Level</span>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-300">
                                {originalData?.level || "UG/PG"}
                            </span>
                        </div>
                    </div>
                </div>

                {originalData?.note || originalData?.details ? (
                    <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="text-yellow-400" size={20} />
                            <h3 className="font-bold text-white">Note</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {originalData?.note || originalData?.details}
                        </p>
                    </div>
                ) : null}

            </div>
        </CareerHubLayout>
    );
}
