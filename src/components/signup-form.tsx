"use client"

import Link from "next/link"
import { Loader2, UserPlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type SignupFormCopy = {
  title: string
  description: string
  name: string
  namePlaceholder: string
  email: string
  emailPlaceholder: string
  password: string
  passwordHint: string
  submit: string
  submitting: string
  loginPrompt: string
  loginAction: string
  termsPrefix: string
  terms: string
  privacyConnector: string
  privacy: string
}

type SignupFormProps = React.ComponentProps<"div"> & {
  copy: SignupFormCopy
  name: string
  email: string
  password: string
  error?: string
  loading: boolean
  disabled?: boolean
  loginHref: string
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function SignupForm({
  className,
  copy,
  name,
  email,
  password,
  error,
  loading,
  disabled,
  loginHref,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  ...props
}: SignupFormProps) {
  const controlsDisabled = loading || disabled

  return (
    <div className={cn("flex w-full flex-col gap-5", className)} {...props}>
      <Card className="gap-0 rounded-[1.75rem] border-primary/10 bg-white py-0 shadow-2xl shadow-primary/8">
        <CardHeader className="gap-0 px-6 pb-0 pt-7 text-center sm:px-8 sm:pt-8">
          <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-primary/6 text-primary">
            <UserPlus className="size-5" />
          </span>
          <CardTitle role="heading" aria-level={1} className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-primary">
            {copy.title}
          </CardTitle>
          <CardDescription className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
            {copy.description}
          </CardDescription>
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
                <FieldLabel htmlFor="signup-name">{copy.name}</FieldLabel>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder={copy.namePlaceholder}
                  value={name}
                  onChange={(event) => onNameChange(event.target.value)}
                  disabled={controlsDisabled}
                  className="h-11 rounded-xl bg-white"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="signup-email">{copy.email}</FieldLabel>
                <Input
                  id="signup-email"
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
                <FieldLabel htmlFor="signup-password">{copy.password}</FieldLabel>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  disabled={controlsDisabled}
                  className="h-11 rounded-xl bg-white"
                  required
                />
                <FieldDescription>{copy.passwordHint}</FieldDescription>
              </Field>
              <Field>
                <Button type="submit" size="lg" disabled={controlsDisabled} className="h-11 w-full rounded-xl font-semibold">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                  {loading ? copy.submitting : copy.submit}
                </Button>
              </Field>
            </FieldGroup>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {copy.loginPrompt}{" "}
            <Link href={loginHref} className="font-semibold text-primary underline-offset-4 hover:underline">
              {copy.loginAction}
            </Link>
          </p>
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
