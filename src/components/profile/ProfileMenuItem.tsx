import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface ProfileMenuItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick?: () => void;
    iconWrapperClassName?: string;
}

export default function ProfileMenuItem({
    icon,
    title,
    subtitle,
    onClick,
    iconWrapperClassName
}: ProfileMenuItemProps) {
    const iconClasses = iconWrapperClassName || "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20";

    return (
        <Button variant="surface"
            onClick={onClick}
            type="button"
            className="w-full flex items-center p-4 bg-transparent hover:bg-white/5 transition-colors text-left group"
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${iconClasses}`}>
                {icon}
            </div>

            <div className="ml-4 flex-1">
                <h3 className="text-white font-semibold text-base mb-0.5">{title}</h3>
                <p className="text-gray-400 text-sm">{subtitle}</p>
            </div>

            <ChevronRight size={20} className="text-gray-500 group-hover:text-white transition-colors" />
        </Button>
    );
}
