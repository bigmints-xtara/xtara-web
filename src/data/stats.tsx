import { Globe, GraduationCap, Star } from "lucide-react";

import { IStats } from "@/types";

export const stats: IStats[] = [
  {
    title: "Explore",
    icon: <GraduationCap size={34} className="text-indigo-600" />,
    description: "Understand broad possibilities before narrowing."
  },
  {
    title: "Test",
    icon: <Star size={34} className="text-yellow-500" />,
    description: "Gather evidence through real activities and conversations."
  },
  {
    title: "Decide",
    icon: <Globe size={34} className="text-green-600" />,
    description: "Choose a current direction and review it later."
  }
];
