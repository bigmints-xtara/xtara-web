// ============================================================================
// xtara-web — Vitest Test Setup
// ============================================================================
import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

// --- Mock Next.js navigation ---
vi.mock("next/navigation", () => {
  return {
    useRouter: vi.fn(() => {
      return {
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
        pathname: "/",
        searchParams: new URLSearchParams(),
      };
    }),
    usePathname: vi.fn(() => "/"),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    useParams: vi.fn(() => ({})),
  };
});

// --- Mock Tailwind CSS (Tailwind v4 CSS module) ---
vi.mock("tailwindcss", () => {
  return {
    default: {},
  };
});

// --- Reset mocks before each test ---
beforeEach(() => {
  vi.clearAllMocks();
});
