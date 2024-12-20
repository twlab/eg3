import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { useNavigation } from "./NavigationStack";

export default function NavigationToolbar({
    title,
}: {
    title?: string;
}) {
    const { canGoBack, pop } = useNavigation();

    return (
        <div className="p-4 flex flex-row justify-between items-center gap-2">
            {canGoBack && (
                <button className="text-primary flex flex-row items-center" onClick={pop}>
                    <ChevronLeftIcon className="size-6" />
                    Back
                </button>
            )}
            {title && <h1 className="text-xl line-clamp-1">{title}</h1>}
            {canGoBack && (
                <button className="text-primary flex flex-row items-center invisible" onClick={pop}>
                    <ChevronLeftIcon className="size-6" />
                    Back
                </button>
            )}
        </div>
    );
}
