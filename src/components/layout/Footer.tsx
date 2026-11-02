"use client";

import Link from "next/link";
import { useTranslations } from "@/i18n/language-provider";
import { useAuth } from '@/context/AuthContext';
import { useOrganizationWorkspace } from '@/context/OrganizationContext';
import { MVP_NAVIGATION_ENABLED, mvpNavigationCopy } from '@/lib/mvp-navigation';

export default function Footer() {
    const { t, locale } = useTranslations();
    const { user } = useAuth();
    const { isStaff, loading, error } = useOrganizationWorkspace();
    const studentMvp = MVP_NAVIGATION_ENABLED && Boolean(user) && !isStaff;
    const copy = mvpNavigationCopy[locale];
    const year = new Date().getFullYear();

    return (
        <footer className="bg-[#0f172c] border-t border-white/10 mt-auto">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-3">{t("footer.brand")}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {t("footer.about")}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">{t("footer.quickLinksTitle")}</h4>
                        <ul className="space-y-2">
                            {studentMvp && !loading && !error && [
                                { href: '/dashboard', label: copy.myDirection },
                                { href: '/explore', label: copy.exploreCareers },
                                { href: '/profile', label: copy.profile },
                            ].map(({ href, label }) => <li key={href}><Link href={href} className="text-gray-400 hover:text-white text-sm transition-colors">{label}</Link></li>)}
                            {!studentMvp && <>
                            <li>
                                <Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    {t("footer.links.about")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/news" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    {t("footer.links.news")}
                                </Link>
                            </li>
                            </>}
                            <li>
                                <Link href="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    {t("footer.links.contact")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    {t("footer.links.privacy")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms-of-use" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    {t("footer.links.terms")}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">{t("footer.contactTitle")}</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="mailto:xtara.connect@gmail.com" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    {t("footer.email")}
                                </a>
                            </li>
                            <li>
                                <a href="tel:+919947793728" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    {t("footer.phone")}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 pt-8 border-t border-white/10 text-center">
                    <p className="text-gray-500 text-sm">
                        {t("footer.copyright", { year })}
                    </p>
                </div>
            </div>
        </footer>
    );
}
