"use client";

import { Suspense, useState } from "react";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  updateProfile,
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/signup-form";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/i18n/language-provider";
import { createApiSession, getPostAuthDestination } from "@/lib/api/auth";
import { savePendingAssessmentToAccount, savePendingDiscoveryToAccount } from "@/lib/discovery-save";
import { getFirebaseAuth } from "@/lib/firebase-client";

function SignupContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { configurationError } = useAuth();
  const { messages } = useTranslations();
  const careerPathId = searchParams.get("careerPathId");
  const shouldSaveDiscovery = searchParams.get("saveDiscovery") === "1";
  const shouldSaveAssessment = searchParams.get("saveAssessment") === "1";
  const educatorMode = searchParams.get("mode") === "educator";
  const requestedNext = searchParams.get("next");
  const commonCopy = messages.auth.common;
  const signupCopy = messages.auth.signup;
  const variantKey = shouldSaveDiscovery
    ? "saveDiscovery"
    : shouldSaveAssessment
      ? "saveAssessment"
      : educatorMode
        ? "educator"
        : "default";
  const variantCopy = signupCopy.variants[variantKey];
  const loginHref = shouldSaveDiscovery
    ? "/login?saveDiscovery=1&next=%2Fdashboard"
    : shouldSaveAssessment && requestedNext
      ? `/login?saveAssessment=1&next=${encodeURIComponent(requestedNext)}`
      : educatorMode
        ? `/login?mode=educator${requestedNext ? `&next=${encodeURIComponent(requestedNext)}` : ""}`
        : "/login";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      const credential =
        currentUser?.isAnonymous
          ? await linkWithCredential(currentUser, EmailAuthProvider.credential(email, password))
          : await createUserWithEmailAndPassword(auth, email, password);

      if (name.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() });
      }

      await createApiSession(await credential.user.getIdToken(true));

      if (shouldSaveDiscovery) {
        await savePendingDiscoveryToAccount(credential.user.uid);
        router.push(safeDestination(requestedNext) ?? "/dashboard");
        return;
      }

      if (shouldSaveAssessment) {
        const didSave = await savePendingAssessmentToAccount(credential.user.uid);
        if (!didSave) throw new Error("Complete the assessment before joining an institution.");
        router.push(safeDestination(requestedNext) ?? "/dashboard");
        return;
      }

      if (careerPathId) {
        router.push(`/assessment/results/${careerPathId}`);
        return;
      }

      router.push(safeDestination(requestedNext) ?? await getPostAuthDestination());
    } catch (err) {
      setError(getFriendlySignupError(err));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      backLabel={commonCopy.backHome}
      imageSrc="/images/home/family-supported-future.jpg"
      imageAlt={signupCopy.imageAlt}
      eyebrow={variantCopy.sideEyebrow}
      title={variantCopy.sideTitle}
      description={variantCopy.sideDescription}
      proofs={variantCopy.sideProofs}
    >
      <SignupForm
        copy={{
          title: variantCopy.title,
          description: variantCopy.description,
          name: signupCopy.name,
          namePlaceholder: signupCopy.namePlaceholder,
          email: commonCopy.email,
          emailPlaceholder: commonCopy.emailPlaceholder,
          password: commonCopy.password,
          passwordHint: signupCopy.passwordHint,
          submit: variantCopy.submit,
          submitting: signupCopy.submitting,
          loginPrompt: signupCopy.loginPrompt,
          loginAction: signupCopy.loginAction,
          termsPrefix: commonCopy.termsPrefix,
          terms: commonCopy.terms,
          privacyConnector: commonCopy.privacyConnector,
          privacy: commonCopy.privacy,
        }}
        name={name}
        email={email}
        password={password}
        error={configurationError || error}
        loading={loading}
        disabled={Boolean(configurationError)}
        loginHref={loginHref}
        onNameChange={setName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSignup}
      />
    </AuthShell>
  );
}

function getFriendlySignupError(err: unknown) {
  const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
  switch (code) {
    case "auth/email-already-in-use": return "An account already exists with that email. Log in instead.";
    case "auth/invalid-email": return "Enter a valid email address.";
    case "auth/weak-password": return "Use a stronger password with at least 6 characters.";
    case "auth/network-request-failed": return "Network issue. Check your connection and try again.";
    default: return err instanceof Error ? err.message : "Failed to create account. Please try again.";
  }
}

function safeDestination(value: string | null): string | null {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-svh items-center justify-center bg-[#f4f8fb]"><Loader2 className="size-7 animate-spin text-primary" /></div>}>
      <SignupContent />
    </Suspense>
  );
}
