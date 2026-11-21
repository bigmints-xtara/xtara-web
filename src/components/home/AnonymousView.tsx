'use client';

import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function AnonymousView() {
  return (
    <div className="space-y-6">
      {/* Sales Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white  overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4 backdrop-blur-sm">
            Unlock Full Access
          </span>
          <h2 className="text-3xl font-bold mb-4">Discover Your True Calling</h2>
          <p className="text-indigo-100 mb-8 max-w-lg text-lg">
            Create an account to save your progress, get personalized career recommendations, and unlock detailed insights about your future path.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button >
              Create Free Account
            </Button>
            <Link 
              href="/assessment?isRetake=true"
              className="px-6 py-3 bg-indigo-500/30 text-white font-semibold rounded-xl hover:bg-indigo-500/40 transition-colors backdrop-blur-sm border border-white/20"
            >
              Retake Assessment
            </Link>
          </div>
        </div>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Personalized Paths', icon: '🎯', desc: 'Custom roadmaps based on your unique profile' },
          { title: 'Expert Content', icon: '📚', desc: 'Curated resources from industry professionals' },
          { title: 'Community', icon: '🌍', desc: 'Connect with mentors and peers in your field' },
        ].map((item) => (
          <div key={item.title} className="bg-white p-6 rounded-xl border hover: transition-shadow">
            <div className="text-3xl mb-4">{item.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
            <p className="text-gray-500 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
