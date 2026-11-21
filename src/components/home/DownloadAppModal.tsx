"use client";

import { Button } from "@/components/ui/button";
import { X, Smartphone } from "lucide-react";
import { useTranslations } from "@/i18n/language-provider";

interface DownloadAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export default function DownloadAppModal({ isOpen, onClose, title }: DownloadAppModalProps) {
    const { t } = useTranslations();
    if (!isOpen) return null;
    const resolvedTitle = title ?? t("downloadModal.defaultTitle");
    const featureLabel = resolvedTitle === t("downloadModal.defaultTitle")
        ? t("downloadModal.featureFallback")
        : resolvedTitle;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1A2342] border border-white/10 rounded-2xl w-full max-w-sm p-6 relative  animate-in fade-in zoom-in duration-200">
                <Button variant="ghost" size="icon" aria-label="Close download options"
                    onClick={onClose}
                    className="absolute top-4 right-4"
                >
                    <X size={20} className="text-gray-400" />
                </Button>

                <div className="text-center pt-4">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400">
                        <Smartphone size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{t("downloadModal.heading")}</h3>
                    <p className="text-gray-300 mb-8 leading-relaxed">
                        {t("downloadModal.body", { feature: featureLabel })}
                    </p>

                    <div className="space-y-3">
                        <Button variant="outline" className="w-full">
                            {t("downloadModal.ios")}
                        </Button>
                        <Button variant="outline" className="w-full">
                            {t("downloadModal.android")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
