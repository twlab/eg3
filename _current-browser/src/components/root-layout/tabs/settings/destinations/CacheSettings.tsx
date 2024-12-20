import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import { useState } from "react";

export default function CacheSettings({ params }: NavigationComponentProps) {
    const {
        onTabSettingsChange,
    } = useGenome();

    const [cacheToggleChecked, setCacheToggleChecked] = useState(true);

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = event.target;
        setCacheToggleChecked(checked);
        onTabSettingsChange({ type: id, val: checked });
    };

    return (
        <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2" htmlFor="cacheToggle">
                <input
                    id="cacheToggle"
                    type="checkbox"
                    checked={cacheToggleChecked}
                    onChange={handleCheckboxChange}
                />
                <span>Restore current view after Refresh</span>
            </label>
        </div>
    );
} 