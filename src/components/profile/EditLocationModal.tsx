import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { X } from "lucide-react";
import { useState } from "react";

// List of Indian states
const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

interface EditLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCity?: string;
    currentState?: string;
    currentCountry?: string;
    onSave: (city: string, state: string, country: string) => Promise<void>;
}

export default function EditLocationModal({
    isOpen,
    onClose,
    currentCity = "",
    currentState = "",
    currentCountry = "India",
    onSave,
}: EditLocationModalProps) {
    const [city, setCity] = useState(currentCity);
    const [state, setState] = useState(currentState);
    const [country, setCountry] = useState(currentCountry);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!city.trim() || !state.trim() || !country.trim()) {
            setError("All fields are required");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await onSave(city.trim(), state.trim(), country.trim());
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-6 ">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Edit Location</h2>
                    <Button variant="ghost" size="icon" aria-label="Close dialog"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        <X size={20} className="text-gray-500" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-600 mb-2 block font-medium">
                            City <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full"
                            placeholder="Enter your city"
                            disabled={isSaving}
 />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 mb-2 block font-medium">
                            State <span className="text-red-500">*</span>
                        </label>
                        <NativeSelect
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full"
                            disabled={isSaving}
                        >
                            <option value="">Select a state</option>
                            {INDIAN_STATES.map((stateName) => (
                                <option key={stateName} value={stateName}>
                                    {stateName}
                                </option>
                            ))}
                        </NativeSelect>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 mb-2 block font-medium">
                            Country <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full"
                            placeholder="Country"
                            disabled={isSaving}
 />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
