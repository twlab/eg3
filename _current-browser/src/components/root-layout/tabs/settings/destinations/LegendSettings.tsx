import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import { useState } from "react";

export default function LegendSettings({ params }: NavigationComponentProps) {
    const {
        legendWidth: trackLegendWidth,
        onTabSettingsChange,
    } = useGenome();
    
    const [legendWidth, setLegendWidth] = useState(`${trackLegendWidth}`);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLegendWidth(event.target.value);
        const numVal = Number(event.target.value);
        if (numVal >= 60) {
            onTabSettingsChange({ type: "legendWidth", val: numVal });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2" htmlFor="legendWidth">
                <input
                    type="number"
                    id="legendWidth"
                    step="5"
                    min="60"
                    max="200"
                    value={legendWidth}
                    onChange={handleChange}
                    className="w-20"
                />
                <span>Change track legend width</span>
            </label>
        </div>
    );
}
