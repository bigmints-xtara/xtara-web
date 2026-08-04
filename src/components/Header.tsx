'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, BookOpen, Menu, Route, Trophy, UserRound } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from "@/context/AuthContext";
import { useOrganizationWorkspace } from "@/context/OrganizationContext";

import Container from './Container';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trackEvent } from "@/lib/analytics";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "@/i18n/language-provider";
import { isWorkspaceRoute, WORKSPACE_MANIFESTS } from "@/lib/workspace-manifest";

const Header = () => {
    const { user } = useAuth();
    const { isStaff, loading: workspaceLoading, error: workspaceError } = useOrganizationWorkspace();
    const { t } = useTranslations();
    const pathname = usePathname();
    const isLoggedIn = Boolean(user);
    const organizationRoute = isWorkspaceRoute("educator", pathname);
    const learnerShell = isLoggedIn && !workspaceLoading && !workspaceError && !isStaff && !organizationRoute;
    const logoHref = isStaff || organizationRoute
        ? WORKSPACE_MANIFESTS.educator.homePath
        : user ? WORKSPACE_MANIFESTS.student.homePath : "/";
    const navItems = isLoggedIn && (workspaceLoading || workspaceError || (organizationRoute && !isStaff))
        ? []
        : isStaff
        ? [
            { key: "organization", url: WORKSPACE_MANIFESTS.educator.homePath },
            { key: "learners", url: `${WORKSPACE_MANIFESTS.educator.homePath}#learners` },
            { key: "classes", url: `${WORKSPACE_MANIFESTS.educator.homePath}#classes` },
            { key: "educatorProfile", url: WORKSPACE_MANIFESTS.educator.profilePath },
        ]
        : isLoggedIn
        ? [
            { key: "career", url: WORKSPACE_MANIFESTS.student.homePath },
            { key: "learn", url: "/learn" },
            { key: "achievements", url: "/achievements" },
            { key: "profile", url: WORKSPACE_MANIFESTS.student.profilePath },
        ]
        : [
            { key: "howItWorks", url: "/#how-it-works" },
            { key: "educators", url: "/educators" },
            { key: "about", url: "/about" },
        ];

    const isActive = (url: string) => {
        // Normalize pathname by removing trailing slash
        const normalizedPathname = pathname.endsWith('/') && pathname !== '/'
            ? pathname.slice(0, -1)
            : pathname;

        if (url === '/') {
            return normalizedPathname === '/';
        }
        // For exact matches like /news, /about, /contact
        if (normalizedPathname === url) {
            return true;
        }
        // For nested routes like /news/[slug]
        if (url !== '/' && normalizedPathname.startsWith(url)) {
            return true;
        }
        return false;
    };

    const learnerIcon = (key: string) => {
        if (key === "learn") return BookOpen;
        if (key === "achievements") return Trophy;
        if (key === "profile") return UserRound;
        return Route;
    };

    return <>
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl">
            <Container className="!px-0">
                <nav className="flex min-h-16 items-center gap-4 px-4 md:px-6">
                    {/* Logo */}
                    <Link
                        href={logoHref}
                        className="flex w-fit items-center rounded-md py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        <Image
                            src="/images/logo-color.svg"
                            alt={t("header.logoAlt")}
                            width={84}
                            height={31}
                            priority
                        />
                    </Link>

                    {/* Desktop Menu */}
                    <ul className="ml-auto hidden items-center justify-end gap-1 xl:flex">
                        {navItems.map(item => {
                            const active = isActive(item.url);
                            return (
                                <li key={item.key}>
                                    <Link
                                        href={item.url}
                                        className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${active
                                            ? 'bg-primary/8 text-primary'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                                            }`}
                                        onClick={() =>
                                            trackEvent({
                                                action: "nav_click",
                                                category: "navigation",
                                                label: `header_${item.key}`,
                                            })
                                        }
                                    >
                                        {t(`header.nav.${item.key}`)}
                                    </Link>
                                </li>
                            );
                        })}
                        {!isLoggedIn && (
                            <li className="ml-2">
                                <Link
                                    href="/login"
                                    className="inline-flex h-10 items-center rounded-full px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                    onClick={() =>
                                        trackEvent({
                                            action: "login_click",
                                            category: "navigation",
                                            label: "header_login",
                                        })
                                    }
                                >
                                    {t("header.cta.login")}
                                </Link>
                            </li>
                        )}
                        {learnerShell ? (
                            <li className="ml-1">
                                <Link
                                    href="/notifications"
                                    aria-label={t("header.nav.notifications")}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                                >
                                    <Bell className="h-5 w-5" />
                                </Link>
                            </li>
                        ) : null}
                        <li className="ml-1">
                            <LanguageSwitcher />
                        </li>
                    </ul>

                    {/* Mobile Menu */}
                    <div className="ml-auto flex items-center justify-end gap-1.5 xl:hidden">
                        {learnerShell ? (
                            <Link
                                href="/notifications"
                                aria-label={t("header.nav.notifications")}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100"
                            >
                                <Bell className="h-5 w-5" />
                            </Link>
                        ) : null}
                        <LanguageSwitcher />
                        {!learnerShell ? <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full text-slate-700 hover:bg-slate-100"
                                >
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">{t("header.menu.open")}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {navItems.map(item => (
                                    <DropdownMenuItem key={item.key} asChild>
                                        <Link
                                            href={item.url}
                                            onClick={() =>
                                                trackEvent({
                                                    action: "nav_click",
                                                    category: "navigation",
                                                    label: `header_mobile_${item.key}`,
                                                })
                                            }
                                        >
                                            {t(`header.nav.${item.key}`)}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                                {!isLoggedIn && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href="/login"
                                                onClick={() =>
                                                    trackEvent({
                                                        action: "login_click",
                                                        category: "navigation",
                                                        label: "header_mobile_login",
                                                    })
                                                }
                                            >
                                                {t("header.cta.login")}
                                            </Link>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu> : null}
                    </div>
                </nav>
            </Container>
        </header>
        {learnerShell ? (
            <nav
                className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl xl:hidden"
                aria-label={t("header.nav.learnerNavigation")}
            >
                <ul className="mx-auto grid max-w-lg grid-cols-4 px-1">
                    {navItems.map((item) => {
                        const Icon = learnerIcon(item.key);
                        const active = isActive(item.url);
                        return (
                            <li key={`learner-tab-${item.key}`}>
                                <Link
                                    href={item.url}
                                    aria-current={active ? "page" : undefined}
                                    className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold transition-colors ${active ? "text-primary" : "text-slate-500 hover:text-slate-900"}`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="max-w-full truncate">{t(`header.nav.${item.key}`)}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        ) : null}
    </>;
};

export default Header;
