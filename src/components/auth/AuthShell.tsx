"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"

import LanguageSwitcher from "@/components/LanguageSwitcher"

type AuthShellProps = {
  children: React.ReactNode
  backLabel: string
  imageSrc: string
  imageAlt: string
  eyebrow: string
  title: string
  description: string
  proofs: string[]
}

export function AuthShell({
  children,
  backLabel,
  imageSrc,
  imageAlt,
  eyebrow,
  title,
  description,
  proofs,
}: AuthShellProps) {
  return (
    <main className="min-h-svh bg-[#f4f8fb] text-foreground">
      <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(430px,0.92fr)]">
        <section className="flex min-w-0 flex-col px-4 py-4 sm:px-7 sm:py-6 lg:px-10 xl:px-16">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="Xtara home" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <Image src="/images/logo-color.svg" alt="Xtara" width={90} height={34} priority />
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/" className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-primary sm:flex">
                <ArrowLeft className="size-4" />
                {backLabel}
              </Link>
              <LanguageSwitcher />
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
            <div className="w-full max-w-[470px]">{children}</div>
          </div>
        </section>

        <aside className="hidden p-4 pl-0 lg:block">
          <div className="relative h-full min-h-[calc(100svh-2rem)] overflow-hidden rounded-[2rem] bg-primary">
            <Image src={imageSrc} alt={imageAlt} fill priority sizes="46vw" className="object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/65 to-primary/10" />
            <div className="absolute inset-x-0 bottom-0 p-8 text-white xl:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">{eyebrow}</p>
              <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.04em] xl:text-5xl">{title}</h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/75">{description}</p>
              <ul className="mt-7 space-y-3">
                {proofs.map((proof) => (
                  <li key={proof} className="flex items-start gap-3 text-sm leading-6 text-white/90">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/20 text-emerald-200">
                      <Check className="size-3.5" />
                    </span>
                    {proof}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
