'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, BookOpen, Compass, Gamepad2, Menu, Route, Trophy, UserRound } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from "@/context/AuthContext";
import { useOrganizationWorkspace } from "@/context/OrganizationContext";

import studentStyles from '@/components/journey/journey.module.css';
import Container from './Container';
import headerStyles from './Header.module.css';
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

import { MVP_NAVIGATION_ENABLED, mvpNavigationCopy } from "@/lib/mvp-navigation";

const Header = () => {
    const { user } = useAuth();
    const { isStaff, loading: workspaceLoading, error: workspaceError } = useOrganizationWorkspace();
    const { t, locale } = useTranslations();
    const pathname = usePathname();
    const isLoggedIn = Boolean(user && !user.isAnonymous);
    const organizationRoute = isWorkspaceRoute("educator", pathname);
    const learnerShell = isLoggedIn && !workspaceLoading && !workspaceError && !isStaff && !organizationRoute;
    const logoHref = isStaff || organizationRoute
        ? WORKSPACE_MANIFESTS.educator.homePath
        : isLoggedIn ? WORKSPACE_MANIFESTS.student.homePath : "/";
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
        ? MVP_NAVIGATION_ENABLED ? [
            { key: "career", url: WORKSPACE_MANIFESTS.student.homePath },
            { key: "explore", url: "/explore" },
            { key: "profile", url: WORKSPACE_MANIFESTS.student.profilePath },
        ] : [
            { key: "career", url: WORKSPACE_MANIFESTS.student.homePath },
            { key: "learn", url: "/learn" },
            { key: "play", url: "/play" },
            { key: "achievements", url: "/achievements" },
            { key: "profile", url: WORKSPACE_MANIFESTS.student.profilePath },
        ]
        : [
            ...(MVP_NAVIGATION_ENABLED ? [{ key: "explore", url: "/explore" }] : []),
            { key: "howItWorks", url: "/#how-it-works" },
            { key: "educators", url: "/educators" },
            { key: "about", url: "/about" },
        ];

    const navLabel = (key: string) => {
        const copy = mvpNavigationCopy[locale];
        if (MVP_NAVIGATION_ENABLED && key === "career") return copy.myDirection;
        if (MVP_NAVIGATION_ENABLED && key === "explore") return copy.exploreCareers;
        if (MVP_NAVIGATION_ENABLED && key === "profile") return copy.profile;
        return t(`header.nav.${key}`);
    };
    const isActive = (url: string) => {
        if (url === "/explore" && pathname.startsWith("/dream-careers/")) return true;
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
        if (key === "explore") return Compass;
        if (key === "learn") return BookOpen;
        if (key === "play") return Gamepad2;
        if (key === "achievements") return Trophy;
        if (key === "profile") return UserRound;
        return Route;
    };

    return <>
        <header className={`${!isStaff && !organizationRoute ? studentStyles.studentChrome : ""} sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-xl`}>
            <Container className="!px-0">
                <nav className={headerStyles.navigation}>
                    {/* Logo */}
                    <Link
                        href={logoHref}
                        className="flex w-fit shrink-0 items-center rounded-md py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        <Image
                            src="/images/logo-color.svg"
                            alt={t("header.logoAlt")}
                            width={88}
                            height={33}
                            priority
                        />
                    </Link>

                    {/* Desktop Menu */}
                    <ul className={headerStyles.links}>
                        {navItems.map(item => {
                            const active = isActive(item.url);
                            return (
                                <li key={item.key}>
                                    <Link
                                        href={item.url}
                                        aria-current={active ? "page" : undefined}
                                        className={headerStyles.navLink}
                                        onClick={() =>
                                            trackEvent({
                                                action: "nav_click",
                                                category: "navigation",
                                                label: `header_${item.key}`,
                                            })
                                        }
                                    >
                                        {navLabel(item.key)}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    <div className={headerStyles.actions}>
                        <LanguageSwitcher />
                        {!isLoggedIn && (
                            <div>
                                <Link
                                    href="/login"
                                    className={headerStyles.login}
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
                            </div>
                        )}
                        {learnerShell && !MVP_NAVIGATION_ENABLED ? (
                            <div>
                                <Link
                                    href="/notifications"
                                    aria-label={t("header.nav.notifications")}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                                >
                                    <Bell className="h-5 w-5" />
                                </Link>
                            </div>
                        ) : null}
                    </div>

                    {/* Mobile Menu */}
                    <div className={headerStyles.compactActions}>
                        {learnerShell && !MVP_NAVIGATION_ENABLED ? (
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
                                    className="h-11 w-11 rounded-full text-foreground hover:bg-muted"
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
                                            aria-current={isActive(item.url) ? "page" : undefined}
                                            className="aria-[current=page]:bg-muted aria-[current=page]:font-semibold"
                                            onClick={() =>
                                                trackEvent({
                                                    action: "nav_click",
                                                    category: "navigation",
                                                    label: `header_mobile_${item.key}`,
                                                })
                                            }
                                        >
                                            {navLabel(item.key)}
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
                className={`${studentStyles.studentChrome} fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden`}
                data-learner-navigation=""
                aria-label={t("header.nav.learnerNavigation")}
            >
                <ul className={`mx-auto grid max-w-lg ${MVP_NAVIGATION_ENABLED ? "grid-cols-3" : "grid-cols-5"} px-1`}>
                    {navItems.map((item) => {
                        const Icon = learnerIcon(item.key);
                        const active = isActive(item.url);
                        return (
                            <li key={`learner-tab-${item.key}`}>
                                <Link
                                    href={item.url}
                                    aria-current={active ? "page" : undefined}
                                    className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="max-w-full text-center leading-tight">{navLabel(item.key)}</span>
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
