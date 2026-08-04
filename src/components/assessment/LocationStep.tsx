"use client";

import { useState, useEffect } from "react";
import { LocationData } from "@/types/assessment";
import { getStates, getStateDetails } from "@/lib/firebase/location";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface LocationStepProps {
    onComplete: (data: LocationData) => void;
}

export default function LocationStep({ onComplete }: LocationStepProps) {
    const [data, setData] = useState<LocationData>({
        state: "",
        district: "",
        city: "",
        locationPreference: ""
    });

    const [states, setStates] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [loadingStates, setLoadingStates] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [locationError, setLocationError] = useState(false);

    useEffect(() => {
        async function load() {
            const s = await getStates();
            setStates(s);
            setLoadingStates(false);
        }
        load();
    }, []);

    const handleStateChange = async (newState: string) => {
        setData(prev => ({
            ...prev,
            state: newState,
            district: "",
            city: "",
            locationPreference: ""
        }));
        setDistricts([]);
        setCities([]);
        setLocationError(false);

        if (newState) {
            setLoadingDetails(true);
            const details = await getStateDetails(newState);
            setDistricts(details.districts.sort());
            setCities(details.cities.sort());
            setLocationError(Boolean(details.unavailable));
            setLoadingDetails(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.state && data.district && data.city && data.locationPreference) {
            onComplete(data);
        }
    };

    const preferenceOptions = [
        "Anywhere in India",
        "I don't know yet",
        ...(data.state ? [`Anywhere in ${data.state}`] : []),
        ...(data.district ? [`Anywhere in ${data.district}`] : []),
        ...(data.city ? [`Anywhere in ${data.city}`] : [])
    ];

    const isComplete = Boolean(data.state && data.district && data.city && data.locationPreference);

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Step 1 of 2</p>
                <Progress value={20} className="mt-2 h-2" />
            </div>

            <div className="mb-6 text-left">
                <h2 className="text-2xl font-semibold text-gray-900">Location details</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Tell us where you want to study or work.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pb-24">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">State *</label>
                    <Select value={data.state} onValueChange={handleStateChange}>
                        <SelectTrigger disabled={loadingStates}>
                            <SelectValue placeholder={loadingStates ? "Loading..." : "Select state"} />
                        </SelectTrigger>
                        <SelectContent>
                            {states.map((state) => (
                                <SelectItem key={state} value={state}>
                                    {state}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {locationError ? (
                    <div role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
                        We could not load districts and cities. Check your connection and select the state again.
                    </div>
                ) : null}

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">District *</label>
                    <Select
                        value={data.district}
                        onValueChange={(value) => setData({ ...data, district: value, city: "", locationPreference: "" })}
                    >
                        <SelectTrigger disabled={!data.state || loadingDetails}>
                            <SelectValue placeholder={loadingDetails ? "Loading..." : "Select district"} />
                        </SelectTrigger>
                        <SelectContent>
                            {districts.map((district) => (
                                <SelectItem key={district} value={district}>
                                    {district}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nearest major city *</label>
                    <Select
                        value={data.city}
                        onValueChange={(value) => setData({ ...data, city: value })}
                    >
                        <SelectTrigger disabled={!data.district || loadingDetails}>
                            <SelectValue placeholder={loadingDetails ? "Loading..." : "Select city"} />
                        </SelectTrigger>
                        <SelectContent>
                            {cities.map((city) => (
                                <SelectItem key={city} value={city}>
                                    {city}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Location preference *</label>
                    <Select
                        value={data.locationPreference}
                        onValueChange={(value) => setData({ ...data, locationPreference: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select preference" />
                        </SelectTrigger>
                        <SelectContent>
                            {preferenceOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 px-4 py-3">
                    <div className="mx-auto max-w-xl">
                        <Button type="submit" className="w-full bg-primary text-white" size="lg" disabled={!isComplete}>
                            Continue
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
