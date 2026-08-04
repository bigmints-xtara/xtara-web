"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import LearnLibrary from "@/components/learn/LearnLibrary";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { useAuth } from "@/context/AuthContext";

export default function LearnLibraryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=%2Flearn");
  }, [loading, router, user]);

  if (loading || !user) return <div className="min-h-screen bg-background"><Navbar /><DashboardSkeleton /></div>;
  return <div className="flex min-h-screen flex-col bg-background text-foreground"><Navbar /><LearnLibrary /><Footer /></div>;
}
