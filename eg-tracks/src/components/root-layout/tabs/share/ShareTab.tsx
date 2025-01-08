import NavigationStack, { NavigationDestination } from "@/components/core-navigation/NavigationStack";
import NavigationLink from "@/components/ui/navigation/NavigationLink";
import { useMemo } from "react";
import Share from "./destinations/Share";

export default function ShareTab() {
    const destinations: NavigationDestination[] = useMemo(() => [
        {
            path: 'share',
            component: Share,
            options: {
                title: "Share Browser State"
            }
        }
    ], []);

    return (
        <NavigationStack destinations={destinations} rootOptions={{ title: 'Share' }}>
            <div className="flex flex-col gap-4">
                <NavigationLink
                    path="share"
                    title="Share Browser State"
                    description="Share your current browser configuration and view"
                />
            </div>
        </NavigationStack>
    )
}
