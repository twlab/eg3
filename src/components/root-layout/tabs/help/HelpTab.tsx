import NavigationStack, { NavigationDestination } from "@/components/core-navigation/NavigationStack";
import NavigationLink from "@/components/ui/navigation/NavigationLink";
import { useMemo } from "react";
import Hotkeys from "./destinations/Hotkeys";
import Documentation from "./destinations/Documentation";

export default function HelpTab() {
    const destinations: NavigationDestination[] = useMemo(() => [
        {
            path: 'hotkeys',
            component: Hotkeys,
            options: {
                title: "Keyboard Shortcuts"
            }
        },
        {
            path: 'documentation',
            component: Documentation,
            options: {
                title: "Documentation & Resources"
            }
        }
    ], []);

    return (
        <NavigationStack destinations={destinations} rootOptions={{ title: 'Help' }}>
            <div className="flex flex-col gap-4">
                <NavigationLink
                    path="hotkeys"
                    title="Keyboard Shortcuts"
                    description="View available keyboard shortcuts and controls"
                />
                <NavigationLink
                    path="documentation"
                    title="Documentation & Resources"
                    description="Access documentation, support, and community resources"
                />
            </div>
        </NavigationStack>
    )
}
