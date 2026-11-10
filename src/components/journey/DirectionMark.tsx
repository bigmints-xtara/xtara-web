import {
  Activity,
  BookOpen,
  Code,
  Compass,
  FlaskConical,
  Landmark,
  Leaf,
  MessagesSquare,
  Palette,
  PlaneTakeoff,
  Ruler,
  TrendingUp,
} from "lucide-react";
import { canonicalCareerDirectionId } from "@/lib/career-direction-imagery";
import styles from "./DirectionMark.module.css";

const directionMarks = {
  "arts-design-and-creative-media": [Palette, "gold"],
  "business-finance-and-entrepreneurship": [TrendingUp, "gold"],
  "communication-culture-and-society": [MessagesSquare, "sky"],
  "digital-and-computing": [Code, "sky"],
  "education-and-human-development": [BookOpen, "gold"],
  "engineering-and-built-world": [Ruler, "sky"],
  "environment-agriculture-and-sustainability": [Leaf, "teal"],
  "government-law-and-public-safety": [Landmark, "sky"],
  "health-and-wellbeing": [Activity, "teal"],
  "science-and-discovery": [FlaskConical, "teal"],
  "travel-hospitality-sports-and-experiences": [PlaneTakeoff, "gold"],
} as const satisfies Record<
  NonNullable<ReturnType<typeof canonicalCareerDirectionId>>,
  readonly [typeof Compass, "sky" | "gold" | "teal"]
>;

/** The adjacent, localized title provides the accessible name. */
export default function DirectionMark({ directionId }: { directionId: string }) {
  const id = canonicalCareerDirectionId(directionId);
  const [Icon, tone] = id ? directionMarks[id] : [Compass, "sky"];
  return (
    <span aria-hidden="true" className={styles.mark} data-tone={tone}>
      <Icon size={24} strokeWidth={1.7} />
    </span>
  );
}
