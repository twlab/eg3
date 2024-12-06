import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { useNavigation } from "../../core-navigation/NavigationStack";

export default function DescriptiveNavigationLink({
    title,
    description,
    path
}: {
    title: string;
    description: string;
    path: string;
}) {
    const { push } = useNavigation();

    const handleClick = () => {
        push({ path });
    }

    return (
        <div
            className="flex flex-row gap-4 bg-secondary p-4 rounded-2xl justify-between items-center cursor-pointer"
            onClick={handleClick}
        >
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl">{title}</h1>
                <p className="text-sm">{description}</p>
            </div>
            <div>
                <ChevronRightIcon className="size-6" />
            </div>
        </div>
    );
}
