"use client"

import Link from "next/link"
import { Building2, GraduationCap, Loader2, LogIn } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

type LoginFormProps = React.ComponentProps<"div"> & {
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
  const educatorMode = mode === "educator"
  const controlsDisabled = loading || disabled

  return (
    <div className={cn("flex w-full flex-col gap-5", className)} {...props}>
      <Card className="gap-0 rounded-[1.75rem] border-primary/10 bg-white py-0 shadow-2xl shadow-primary/8">
        <CardHeader className="gap-0 px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" aria-label={copy.chooseType}>
            <Link
              href={learnerHref}
              aria-current={!educatorMode ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors",
                !educatorMode ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900",
              )}
            >
              <GraduationCap className="size-4" />
              {copy.learnerTab}
            </Link>
            <Link
              href={educatorHref}
              aria-current={educatorMode ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors",
                educatorMode ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900",
              )}
            >
              <Building2 className="size-4" />
              {copy.educatorTab}
            </Link>
          </div>

          <div className="pt-7 text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-primary/6 text-primary">
              {educatorMode ? <Building2 className="size-5" /> : <GraduationCap className="size-5" />}
            </span>
            <CardTitle role="heading" aria-level={1} className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-primary">
              {copy.title}
            </CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
              {copy.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
          {error ? (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit}>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="login-email">{copy.email}</FieldLabel>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  disabled={controlsDisabled}
                  className="h-11 rounded-xl bg-white"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="login-password">{copy.password}</FieldLabel>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  disabled={controlsDisabled}
                  className="h-11 rounded-xl bg-white"
                  required
                />
              </Field>
              <Field>
                <Button type="submit" size="lg" disabled={controlsDisabled} className="h-11 w-full rounded-xl font-semibold">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                  {loading ? copy.submitting : copy.submit}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-white">
                {copy.divider}
              </FieldSeparator>

              <Field>
                <Button type="button" size="lg" variant="outline" disabled={controlsDisabled} className="h-11 w-full rounded-xl bg-white" onClick={onGoogleLogin}>
                  <GoogleMark />
                  {copy.google}
                </Button>
              </Field>
            </FieldGroup>
          </form>

          {copy.educatorNote ? (
            <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900">
              {copy.educatorNote}
            </p>
          ) : null}

          <div className="mt-6 space-y-2 text-center text-sm text-slate-600">
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
        </CardContent>
      </Card>

      <FieldDescription className="px-5 text-center text-xs leading-5">
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
