import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import { useState, useEffect } from "react";

export default function NavigatorSettings({ params }: NavigationComponentProps) {
    const {
        showGenNav,
        onTabSettingsChange,
    } = useGenome();

    const [switchNavigatorChecked, setSwitchNavigatorChecked] = useState(true);

    useEffect(() => {
        setSwitchNavigatorChecked(showGenNav);
    }, [showGenNav]);

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = event.target;
        setSwitchNavigatorChecked(checked);
        onTabSettingsChange({ type: id, val: checked });
    };

    return (
        <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2" htmlFor="switchNavigator">
                <input
                    id="switchNavigator"
                    type="checkbox"
                    checked={switchNavigatorChecked}
                    onChange={handleCheckboxChange}
                />
                <span>Show genome-wide navigator</span>
                <span className="GenomeNavigator-tooltip" role="img" aria-label="genomenavigator">
                    ❓
                    <div className="GenomeNavigator-tooltiptext">
                        <ul className="leading-tight mb-0">
                            <li>Left mouse drag: select</li>
                            <li>Right mouse drag: pan</li>
                            <li>Mousewheel: zoom</li>
                        </ul>
                    </div>
                </span>
            </label>
        </div>
    );
} 