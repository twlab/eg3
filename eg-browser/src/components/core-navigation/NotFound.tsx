import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Button from "../ui/button/Button";
import { useNavigation } from "./NavigationStack";



export default function NotFound() {
    const { pop } = useNavigation();

    return (
        <div className="flex flex-col gap-4 items-center justify-center h-full">
            <ExclamationTriangleIcon className="size-8" />
            <p>Couldn't navigate</p>
            <Button onClick={pop}>Go back</Button>
        </div>
    );
}
