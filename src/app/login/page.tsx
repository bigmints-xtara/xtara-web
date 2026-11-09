"use client";

import { Suspense, useState } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { createApiSession, getPostAuthDestination } from "@/lib/api/auth";
import { savePendingAssessmentToAccount, savePendingCareerChoiceToAccount } from "@/lib/discovery-save";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { getOrganizationContext } from "@/lib/organization";
import { friendlyLoginError } from "@/lib/login-error";
import { MVP_NAVIGATION_ENABLED, mvpNavigationCopy } from "@/lib/mvp-navigation";
import { workspaceDestination, WORKSPACE_MANIFESTS } from "@/lib/workspace-manifest";

type LoginMode = "learner" | "educator";

export default function LoginPage() {
  return <Suspense fallback={<LoginLoading />}><LoginContent /></Suspense>;
}

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { messages, locale } = useTranslations();
  const { configurationError } = useAuth();
  const mode: LoginMode = searchParams.get("mode") === "educator" ? "educator" : "learner";
  const educatorMode = mode === "educator";
  const requestedNext = educatorMode
    ? educatorDestination(searchParams.get("next"))
    : learnerDestination(searchParams.get("next"));
  const learnerHref = loginModeHref(searchParams, "learner");
  const educatorHref = loginModeHref(searchParams, "educator");
  const signupHref = signupModeHref(searchParams, mode);
  const commonCopy = messages.auth.common;
  const loginCopy = messages.auth.login;
  const modeCopy = educatorMode ? loginCopy.educator : loginCopy.learner;

  async function finishLogin(userId: string, idToken: string) {
    await createApiSession(idToken);
    if (searchParams.get("saveDiscovery") === "1") {
      const didSave = await savePendingCareerChoiceToAccount(userId);
      if (!didSave) throw new Error("Choose your Career Direction and Dream Careers before signing in.");
      router.push(requestedNext || "/dashboard");
      return;
    }
    if (searchParams.get("saveAssessment") === "1") {
      const didSave = await savePendingAssessmentToAccount(userId);
      if (!didSave) throw new Error("Complete the assessment before joining an institution.");
      router.push(requestedNext || WORKSPACE_MANIFESTS.student.homePath);
      return;
    }
    if (educatorMode) {
      const context = await getOrganizationContext();
      if (context?.membership.role === "student") {
        throw new Error("This account currently has a student membership. Use learner login to open your personal career path.");
      }
      if (context) {
        router.push(requestedNext || WORKSPACE_MANIFESTS.educator.homePath);
        return;
      }
      if (requestedNext?.startsWith("/join/")) {
        router.push(requestedNext);
        return;
      }
      router.push(`${WORKSPACE_MANIFESTS.educator.homePath}/signup`);
      return;
    }
    const context = await getOrganizationContext().catch(() => null);
    if (context?.membership.role && context.membership.role !== "student") {
      router.push(WORKSPACE_MANIFESTS.educator.homePath);
      return;
    }
    router.push(requestedNext || await getPostAuthDestination());
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      await finishLogin(credential.user.uid, await credential.user.getIdToken());
    } catch (reason) {
      setError(friendlyLoginError(reason));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const credential = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      await finishLogin(credential.user.uid, await credential.user.getIdToken());
    } catch (reason) {
      setError(friendlyLoginError(reason));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      backLabel={commonCopy.backHome}
      imageSrc={educatorMode ? "/images/home/student-guidance.jpg" : "/images/home/hero-career-exploration.jpg"}
      imageAlt={modeCopy.imageAlt}
      eyebrow={modeCopy.sideEyebrow}
      title={modeCopy.sideTitle}
      description={modeCopy.sideDescription}
      proofs={modeCopy.sideProofs}
    >
      <LoginForm
        mode={mode}
        copy={{
          chooseType: loginCopy.chooseType,
          learnerTab: loginCopy.learnerTab,
          educatorTab: loginCopy.educatorTab,
          title: modeCopy.title,
          description: modeCopy.description,
          email: commonCopy.email,
          emailPlaceholder: commonCopy.emailPlaceholder,
          password: commonCopy.password,
          submit: modeCopy.submit,
          submitting: modeCopy.submitting,
          google: modeCopy.google,
          divider: loginCopy.divider,
          assessmentPrompt: loginCopy.assessmentPrompt,
          assessmentAction: loginCopy.assessmentAction,
          signupPrompt: loginCopy.signupPrompt,
          signupAction: loginCopy.signupAction,
          educatorNote: educatorMode ? loginCopy.educator.educatorNote : undefined,
          termsPrefix: commonCopy.termsPrefix,
          terms: commonCopy.terms,
          privacyConnector: commonCopy.privacyConnector,
          privacy: commonCopy.privacy,
        }}
        email={email}
        password={password}
        error={configurationError || error}
        loading={loading}
        disabled={Boolean(configurationError)}
        learnerHref={learnerHref}
        educatorHref={educatorHref}
        signupHref={signupHref}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
        onGoogleLogin={handleGoogleLogin}
      />
      {!educatorMode && MVP_NAVIGATION_ENABLED && (
        <Button asChild variant="ghost" className="mt-4 w-full">
          <Link href="/explore">{mvpNavigationCopy[locale].exploreCareers}</Link>
        </Button>
      )}
    </AuthShell>
  );
}

function loginModeHref(params: Readonly<URLSearchParams>, mode: LoginMode) {
  const next = new URLSearchParams(params.toString());
  if (mode === "educator") next.set("mode", "educator");
  else next.delete("mode");
  const query = next.toString();
  return query ? `/login?${query}` : "/login";
}

function signupModeHref(params: Readonly<URLSearchParams>, mode: LoginMode) {
  const next = new URLSearchParams(params.toString());
  if (mode === "educator") {
    next.set("mode", "educator");
    if (!next.has("next")) next.set("next", "/organization/signup");
  } else {
    next.delete("mode");
  }
  const query = next.toString();
  return query ? `/signup?${query}` : "/signup";
}

function learnerDestination(value: string | null) {
  return workspaceDestination("student", value) || joinDestination(value);
}

function educatorDestination(value: string | null) {
  return workspaceDestination("educator", value) || joinDestination(value);
}

function joinDestination(value: string | null) {
  return value?.startsWith("/join/") && !value.startsWith("//") ? value : null;
}

function LoginLoading() {
  return <div className="flex min-h-screen items-center justify-center bg-[#f7fafc]"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
}
