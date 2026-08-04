"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { Loader2, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { createApiSession, logoutApiSession } from "@/lib/api/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { WORKSPACE_MANIFESTS } from "@/lib/workspace-manifest";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { configurationError } = useAuth();
  const router = useRouter();

  async function finishLogin(idToken: string) {
    await createApiSession(idToken);
    router.replace(WORKSPACE_MANIFESTS.admin.homePath);
    router.refresh();
  }

  async function authenticate(
    method: "password" | "google",
    action: () => Promise<{ user: { getIdToken: () => Promise<string> } }>,
  ) {
    setError("");
    setSubmitting(true);
    let identityEstablished = false;
    try {
      const credential = await action();
      identityEstablished = true;
      await finishLogin(await credential.user.getIdToken());
    } catch (reason) {
      await logoutApiSession().catch(() => undefined);
      await signOut(getFirebaseAuth()).catch(() => undefined);
      setError(friendlyAdminLoginError(reason, { identityEstablished, method }));
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-5 py-10 text-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center">
          <Link className="rounded-lg bg-white px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" href="/">
            <Image alt="Xtara" height={31} priority src="/images/logo-color.svg" width={84} />
          </Link>
        </div>

        <Card className="gap-0 rounded-3xl border-white/10 bg-white py-0 shadow-2xl shadow-black/30">
          <CardHeader className="px-6 pb-0 pt-7 text-center sm:px-8 sm:pt-8">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
              <ShieldCheck className="size-6" />
            </span>
            <CardTitle aria-level={1} className="mt-4 text-2xl tracking-tight" role="heading">Xtara administration</CardTitle>
            <CardDescription className="mt-2 leading-6">
              Sign in with an authorized platform administrator or content editor account.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-7 pt-7 sm:px-8 sm:pb-8">
            {configurationError || error ? (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700" role="alert">
                {configurationError || error}
              </div>
            ) : null}

            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void authenticate("password", () => signInWithEmailAndPassword(getFirebaseAuth(), email, password));
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin email</Label>
                <Input
                  autoComplete="email"
                  className="h-11 rounded-xl"
                  disabled={submitting || Boolean(configurationError)}
                  id="admin-email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  autoComplete="current-password"
                  className="h-11 rounded-xl"
                  disabled={submitting || Boolean(configurationError)}
                  id="admin-password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>
              <Button className="h-11 w-full rounded-xl font-semibold" disabled={submitting || Boolean(configurationError)} size="lg" type="submit">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                {submitting ? "Checking admin access…" : "Open admin workspace"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" />
            </div>

            <Button
              className="h-11 w-full rounded-xl"
              disabled={submitting || Boolean(configurationError)}
              onClick={() => void authenticate("google", () => signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider()))}
              size="lg"
              type="button"
              variant="outline"
            >
              <LockKeyhole className="size-4" />
              Continue with authorized Google account
            </Button>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              This entry is only for Xtara platform operations. Students and educators use the regular {" "}
              <Link className="font-semibold text-primary underline-offset-4 hover:underline" href="/login">login</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export function AdminAccessRequired({ email }: { email?: string | null }) {
  const [signingOut, setSigningOut] = useState(false);

  async function signInWithAnotherAccount() {
    setSigningOut(true);
    await logoutApiSession().catch(() => undefined);
    await signOut(getFirebaseAuth()).catch(() => undefined);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-5 py-10">
      <Card className="w-full max-w-md gap-0 rounded-3xl border-white/10 py-0 text-center shadow-2xl">
        <CardHeader className="px-7 pb-0 pt-8">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800"><LockKeyhole /></span>
          <CardTitle aria-level={1} className="mt-4" role="heading">Admin access required</CardTitle>
          <CardDescription className="mt-2 leading-6">
            {email ? `${email} is signed in, but` : "This account"} does not have an Xtara platform admin or editor role.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-7 pb-8 pt-6">
          <Button className="w-full" disabled={signingOut} onClick={() => void signInWithAnotherAccount()}>
            {signingOut ? <Loader2 className="animate-spin" /> : null}
            Sign in with an admin account
          </Button>
          <Button asChild className="mt-3 w-full" variant="ghost"><Link href="/">Return to Xtara</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}

function friendlyAdminLoginError(
  reason: unknown,
  state: { identityEstablished: boolean; method: "password" | "google" },
) {
  const code = typeof reason === "object" && reason && "code" in reason ? String(reason.code) : "";
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(code)) {
    return "Incorrect admin email or password.";
  }
  if (code === "auth/popup-closed-by-user") return "Admin sign-in was cancelled.";
  if (code === "auth/popup-blocked") return "Your browser blocked the Google sign-in window. Allow pop-ups for Xtara and try again.";
  if (code === "auth/unauthorized-domain") return "Google sign-in is not enabled for this Xtara domain.";
  if (code === "auth/account-exists-with-different-credential") {
    return "This email already uses another sign-in method. Sign in with the original method first.";
  }
  if (code === "auth/too-many-requests") return "Too many attempts. Wait a moment and try again.";
  if (code === "auth/network-request-failed") return "The admin login service could not be reached. Check your connection and try again.";
  if (state.identityEstablished) {
    return `${state.method === "google" ? "Google" : "Password"} sign-in succeeded, but Xtara could not start the admin session. Please try again.`;
  }
  return reason instanceof Error ? reason.message : "Admin sign-in failed. Please try again.";
}
