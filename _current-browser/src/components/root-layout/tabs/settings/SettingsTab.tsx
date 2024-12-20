import NavigationStack, { NavigationDestination } from "@/components/core-navigation/NavigationStack";
import NavigationLink from "@/components/ui/navigation/NavigationLink";
import { useMemo } from "react";
import NavigatorSettings from "./destinations/NavigatorSettings";
import CacheSettings from "./destinations/CacheSettings";
import LegendSettings from "./destinations/LegendSettings";

export default function SettingsTab() {
    const destinations: NavigationDestination[] = useMemo(() => [
        {
            path: 'navigator',
            component: NavigatorSettings,
            options: {
                title: "Navigator Settings"
            }
        },
        {
            path: 'cache',
            component: CacheSettings,
            options: {
                title: "Cache Settings"
            }
        },
        {
            path: 'legend',
            component: LegendSettings,
            options: {
                title: "Legend Settings"
            }
        }
    ], []);

    return (
        <NavigationStack destinations={destinations} rootOptions={{ title: 'Settings' }}>
            <div className="flex flex-col gap-4">
                <NavigationLink
                    path="navigator"
                    title="Navigator Settings"
                    description="Configure genome navigator display options"
                />
                <NavigationLink
                    path="cache"
                    title="Cache Settings"
                    description="Configure browser cache and view restoration"
                />
                <NavigationLink
                    path="legend"
                    title="Legend Settings"
                    description="Configure track legend appearance"
                />
            </div>
        </NavigationStack>
    )
}
