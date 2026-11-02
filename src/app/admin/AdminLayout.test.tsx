import { render, screen, waitFor } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminLayout from "@/app/admin/layout";

const mocks = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("@/context/AuthContext", () => ({ useAuth: mocks.useAuth }));

describe("admin workspace routing", () => {
  const replace = vi.fn();

  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/admin");
    vi.mocked(useRouter).mockReturnValue({ replace, refresh: vi.fn() } as never);
  });

  it("shows the dedicated admin login at /admin when signed out", () => {
    mocks.useAuth.mockReturnValue({ user: null, userProfile: null, loading: false, configurationError: null });
    render(<AdminLayout><p>Private admin content</p></AdminLayout>);

    expect(screen.getByRole("heading", { name: "Xtara administration" })).toBeInTheDocument();
    expect(screen.getByText(/students and educators use the regular/i)).toBeInTheDocument();
    expect(screen.queryByText("Private admin content")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("returns signed-out nested admin requests to the /admin login entry", async () => {
    vi.mocked(usePathname).mockReturnValue("/admin/stories");
    mocks.useAuth.mockReturnValue({ user: null, userProfile: null, loading: false, configurationError: null });
    render(<AdminLayout><p>Private admin content</p></AdminLayout>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
    expect(screen.getByText("Opening admin sign in…")).toBeInTheDocument();
  });

  it("explains the role boundary to a signed-in non-admin account", () => {
    mocks.useAuth.mockReturnValue({
      user: { email: "student@example.com" },
      userProfile: { email: "student@example.com", roles: { isAdmin: false } },
      loading: false,
      configurationError: null,
    });
    render(<AdminLayout><p>Private admin content</p></AdminLayout>);

    expect(screen.getByRole("heading", { name: "Admin access required" })).toBeInTheDocument();
    expect(screen.getByText(/does not have an Xtara platform admin or editor role/i)).toBeInTheDocument();
    expect(screen.queryByText("Private admin content")).not.toBeInTheDocument();
  });

  it("renders the admin workspace only for an authorized platform role", () => {
    mocks.useAuth.mockReturnValue({
      user: { email: "admin@example.com", displayName: "Admin" },
      userProfile: { email: "admin@example.com", displayName: "Admin", adminRole: "admin" },
      loading: false,
      configurationError: null,
    });
    render(<AdminLayout><p>Private admin content</p></AdminLayout>);

    expect(screen.getByText("Private admin content")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Xtara administration" })).not.toBeInTheDocument();
  });
});
