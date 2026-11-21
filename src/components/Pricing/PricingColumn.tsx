import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { CheckCircle2 } from "lucide-react";

import { IPricing } from "@/types";

interface Props {
    tier: IPricing;
    highlight?: boolean;
}

const PricingColumn = ({ tier, highlight }: Props) => {
    const { name, price, features } = tier;

    return (
        <div className={clsx("w-full max-w-sm mx-auto bg-white rounded-xl border border-gray-200 lg:max-w-full", { "": highlight })}>
            <div className="p-6 border-b border-gray-200 rounded-t-xl">
                <h3 className="text-2xl font-semibold mb-4">{name}</h3>
                <p className="text-3xl md:text-5xl font-bold mb-6">
                    <span className={clsx({ "text-black": highlight })}>
                        {typeof price === 'number' ? `$${price}` : price}
                    </span>
                    {typeof price === 'number' && <span className="text-lg font-normal text-gray-600">/mo</span>}
                </p>
                <Button variant={highlight ? "default" : "secondary"} className="w-full">
                    Get Started
                </Button>
            </div>
            <div className="p-6 mt-1">
                <p className="font-bold mb-0">FEATURES</p>
                <p className="text-muted-foreground mb-5">Everything in basic, plus...</p>
                <ul className="space-y-4 mb-8">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                            <CheckCircle2 className="h-5 w-5 text-sky-500 mr-2" />
                            <span className="text-muted-foreground">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default PricingColumn
