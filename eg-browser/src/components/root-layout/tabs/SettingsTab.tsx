import NavigationStack, { NavigationDestination } from "@/components/core-navigation/NavigationStack";
import Switch from "@/components/ui/switch/Switch";
import { selectIsNavigatorVisible, setNavigatorVisibility, selectDarkTheme, setDarkTheme } from "@/lib/redux/slices/settingsSlice";
import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";


export default function SettingsTab() {
    const dispatch = useAppDispatch();
    const isNavigatorVisible = useAppSelector(selectIsNavigatorVisible);
    const isDarkTheme = useAppSelector(selectDarkTheme);

    const destinations: NavigationDestination[] = useMemo(() => [

    ], []);

    return (
        <NavigationStack destinations={destinations} rootOptions={{ title: 'Settings' }}>
            <div className="flex flex-col gap-4 pt-4">
                <div className="w-full flex items-center justify-between">
                    <p>Show Navigator</p>
                    <Switch
                        checked={isNavigatorVisible}
                        onChange={(checked) => dispatch(setNavigatorVisibility(checked))}
                    />
                </div>
                <div className="w-full h-[1px] bg-gray-200"></div>
                <div className="w-full flex items-center justify-between">
                    <p>Dark Mode</p>
                    <Switch
                        checked={isDarkTheme}
                        onChange={(checked) => dispatch(setDarkTheme(checked))}
                    />
                </div>
            </div>
        </NavigationStack>
    )
}