"use client";

import { useAuth } from "@/context/AuthContext";
import UserDashboard from "@/components/home/UserDashboard";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OrganizationMembershipCard from "@/components/organization/OrganizationMembershipCard";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [user, loading, router]);

    // Show skeleton while loading or redirecting
    if (loading || !user) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <DashboardSkeleton />
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <OrganizationMembershipCard />
            <UserDashboard />
            <Footer />
        </div>
    );
}
