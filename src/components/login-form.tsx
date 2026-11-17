"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, GraduationCap, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type LoginFormCopy = {
  chooseType: string
  learnerTab: string
  educatorTab: string
  title: string
  description: string
  email: string
  emailPlaceholder: string
  password: string
  showPassword: string
  hidePassword: string
  submit: string
  submitting: string
  google: string
  divider: string
  assessmentPrompt: string
  assessmentAction: string
  signupPrompt: string
  signupAction: string
  educatorNote?: string
  termsPrefix: string
  terms: string
  privacyConnector: string
  privacy: string
}

type LoginFormProps = Omit<React.ComponentProps<"div">, "onSubmit"> & {
  mode: "learner" | "educator"
  copy: LoginFormCopy
  email: string
  password: string
  error?: string
  loading: boolean
  disabled?: boolean
  learnerHref: string
  educatorHref: string
  signupHref: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onGoogleLogin: () => void
}

export function LoginForm({
  className,
  mode,
  copy,
  email,
  password,
  error,
  loading,
  disabled,
  learnerHref,
  educatorHref,
  signupHref,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleLogin,
  ...props
}: LoginFormProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const educatorMode = mode === "educator"
  const controlsDisabled = loading || disabled

  return (
    <div className={cn("flex w-full flex-col gap-5", className)} {...props}>
      <div>
        <div>
          <nav className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/50 p-1" aria-label={copy.chooseType}>
            <Link
              href={learnerHref}
              aria-current={!educatorMode ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                !educatorMode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <GraduationCap className="size-4 shrink-0" aria-hidden="true" />
              {copy.learnerTab}
            </Link>
            <Link
              href={educatorHref}
              aria-current={educatorMode ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                educatorMode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Building2 className="size-4 shrink-0" aria-hidden="true" />
              {copy.educatorTab}
            </Link>
          </nav>

          <div className="pb-7 pt-8">
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-primary">{copy.title}</h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">{copy.description}</p>
          </div>
        </div>

        <div>
          {error ? (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} aria-busy={loading}>
            <FieldGroup className="gap-5">
              <Field>
                <Button type="button" size="lg" variant="outline" disabled={controlsDisabled} className="h-auto min-h-12 w-full whitespace-normal rounded-xl bg-background px-4 py-3 font-medium shadow-none" onClick={onGoogleLogin}>
                  <GoogleMark />
                  {copy.google}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-background">{copy.divider}</FieldSeparator>

              <Field>
                <FieldLabel htmlFor="login-email">{copy.email}</FieldLabel>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="email"
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  disabled={controlsDisabled}
                  className="h-12 rounded-xl bg-background px-4 shadow-none"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="login-password">{copy.password}</FieldLabel>
                <div className="relative">
                <Input
                  id="login-password"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  disabled={controlsDisabled}
                  className="h-12 rounded-xl bg-background pl-4 pr-14 shadow-none"
                  required
                />
                  <button
                    type="button"
                    aria-label={passwordVisible ? copy.hidePassword : copy.showPassword}
                    aria-pressed={passwordVisible}
                    aria-controls="login-password"
                    disabled={controlsDisabled}
                    onClick={() => setPasswordVisible(visible => !visible)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                  >
                    {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </Field>
              <Field>
                <Button type="submit" size="lg" disabled={controlsDisabled} className="h-auto min-h-12 w-full whitespace-normal rounded-xl px-5 py-3 font-semibold">
                  {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {loading ? copy.submitting : copy.submit}
                  {!loading ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
                </Button>
              </Field>

            </FieldGroup>
          </form>

          {copy.educatorNote ? (
            <p className="mt-5 rounded-xl bg-muted/60 px-4 py-3 text-sm leading-6 text-muted-foreground">
              {copy.educatorNote}
            </p>
          ) : null}

          <div className="mt-6 space-y-3 text-center text-sm leading-6 text-muted-foreground">
            {!educatorMode ? (
              <p>
                {copy.assessmentPrompt}{" "}
                <Link href="/assessment" className="font-semibold text-primary underline-offset-4 hover:underline">
                  {copy.assessmentAction}
                </Link>
              </p>
            ) : null}
            <p>
              {copy.signupPrompt}{" "}
              <Link href={signupHref} className="font-semibold text-primary underline-offset-4 hover:underline">
                {copy.signupAction}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <FieldDescription className="border-t border-border pt-5 text-center text-xs leading-5">
        {copy.termsPrefix}{" "}
        <Link href="/terms-of-use">{copy.terms}</Link>{" "}
        {copy.privacyConnector}{" "}
        <Link href="/privacy-policy">{copy.privacy}</Link>.
      </FieldDescription>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        fill="currentColor"
      />
    </svg>
  )
}
