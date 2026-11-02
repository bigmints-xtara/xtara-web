"use client";

import Link from 'next/link';
import Image from 'next/image';
// import { FaFingerprint } from 'react-icons/fa';

import { getPlatformIconByName } from '@/utils';
import { useTranslations } from '@/i18n/language-provider';
import { useAuth } from '@/context/AuthContext';
import { useOrganizationWorkspace } from '@/context/OrganizationContext';
import { MVP_NAVIGATION_ENABLED, mvpNavigationCopy } from '@/lib/mvp-navigation';

const Footer = () => {
    const { t, messages, locale } = useTranslations();
    const { user } = useAuth();
    const { isStaff, loading, error } = useOrganizationWorkspace();
    const studentMvp = MVP_NAVIGATION_ENABLED && Boolean(user) && !isStaff;
    const studentLinksReady = studentMvp && !loading && !error;
    const copy = mvpNavigationCopy[locale];
    const year = new Date().getFullYear();
    const socials = messages.footer.socials ?? {};

    return (
        <footer className="bg-muted text-foreground py-10">
            <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
                <div>
                    <Link href={studentMvp ? '/dashboard' : '/'} className="flex items-center gap-2">
                        <Image
                            src="/images/logo-dark.svg"
                            alt={t("header.logoAlt")}
                            width={66}
                            height={24}
                        />

                    </Link>
                    <p className="mt-3.5 text-muted-foreground">
                        {t("footer.about")}
                    </p>
                </div>
                <div>
                    <h4 className="text-lg font-semibold mb-4 text-foreground">{t("footer.quickLinksTitle")}</h4>
                    <ul className="text-muted-foreground">
                        {studentLinksReady && [
                            { href: '/dashboard', label: copy.myDirection },
                            { href: '/explore', label: copy.exploreCareers },
                            { href: '/profile', label: copy.profile },
                        ].map(({ href, label }) => <li key={href} className="mb-2"><Link href={href} className="hover:text-foreground transition-colors">{label}</Link></li>)}
                        {!studentMvp && <>
                        <li className="mb-2">
                            <Link href="/about" className="hover:text-foreground transition-colors">{t("footer.links.about")}</Link>
                        </li>
                        <li className="mb-2">
                            <Link href="/news" className="hover:text-foreground transition-colors">{t("footer.links.news")}</Link>
                        </li>
                        </>}
                        <li className="mb-2">
                            <Link href="/contact" className="hover:text-foreground transition-colors">{t("footer.links.contact")}</Link>
                        </li>
                        <li className="mb-2">
                            <Link href="/terms-of-use" className="hover:text-foreground transition-colors">{t("footer.links.terms")}</Link>
                        </li>
                        <li className="mb-2">
                            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">{t("footer.links.privacy")}</Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-lg font-semibold mb-4">{t("footer.contactTitle")}</h4>

                    {messages.footer.email && <a href={`mailto:${messages.footer.email}`} className="block text-muted-foreground hover:text-foreground">{t("footer.labels.email")}: {messages.footer.email}</a>}

                    {messages.footer.phone && <a href={`tel:${messages.footer.phone}`} className="block text-muted-foreground hover:text-foreground">{t("footer.labels.phone")}: {messages.footer.phone}</a>}

                    {!studentMvp && socials && (
                        <div className="mt-5 flex items-center gap-5 flex-wrap">
                            {Object.keys(socials).map(key => {
                                const platformName = key as keyof typeof socials;
                                if (platformName && socials[platformName]) {
                                    return (
                                        <Link
                                            href={socials[platformName]}
                                            key={platformName}
                                            aria-label={platformName}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            {getPlatformIconByName(platformName)}
                                        </Link>
                                    )
                                }
                            })}
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-8 md:text-center text-muted-foreground px-6">
                <p>{t("footer.copyright", { year })}</p>
            </div>
        </footer>
    );
};

export default Footer;
