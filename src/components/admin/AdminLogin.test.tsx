import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminLogin from "@/components/admin/AdminLogin";

const mocks = vi.hoisted(() => ({
  createApiSession: vi.fn(),
  getFirebaseAuth: vi.fn(() => ({ name: "firebase-auth" })),
  getIdToken: vi.fn(),
  logoutApiSession: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: class GoogleAuthProvider {},
  signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
  signInWithPopup: mocks.signInWithPopup,
  signOut: mocks.signOut,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }),
}));
vi.mock("@/context/AuthContext", () => ({ useAuth: mocks.useAuth }));
vi.mock("@/lib/api/auth", () => ({
  createApiSession: mocks.createApiSession,
  logoutApiSession: mocks.logoutApiSession,
}));
vi.mock("@/lib/firebase-client", () => ({ getFirebaseAuth: mocks.getFirebaseAuth }));

describe("admin Google login", () => {
  beforeEach(() => {
    mocks.useAuth.mockReturnValue({ configurationError: null });
    mocks.getIdToken.mockResolvedValue("firebase-id-token");
    mocks.signInWithPopup.mockResolvedValue({ user: { getIdToken: mocks.getIdToken } });
    mocks.createApiSession.mockResolvedValue({ uid: "admin-1" });
    mocks.logoutApiSession.mockResolvedValue(undefined);
    mocks.signOut.mockResolvedValue(undefined);
  });

  it("creates the API session and opens /admin after Google succeeds", async () => {
    render(<AdminLogin />);

    fireEvent.click(screen.getByRole("button", { name: "Continue with authorized Google account" }));

    await waitFor(() => expect(mocks.createApiSession).toHaveBeenCalledWith("firebase-id-token"));
    expect(mocks.replace).toHaveBeenCalledWith("/admin");
    expect(mocks.refresh).toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("reports a session failure separately from the Google popup", async () => {
    mocks.createApiSession.mockRejectedValue(new Error("API unavailable"));
    render(<AdminLogin />);

    fireEvent.click(screen.getByRole("button", { name: "Continue with authorized Google account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Google sign-in succeeded, but Xtara could not start the admin session",
    );
    expect(mocks.signOut).toHaveBeenCalled();
  });
});
