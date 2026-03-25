import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { NavigationDestinationOptions, useNavigation } from "./NavigationStack";

export default function NavigationToolbar({
  options,
}: {
  options?: NavigationDestinationOptions;
}) {
  const { canGoBack, pop } = useNavigation();

  const navigationBarEmpty =
    !canGoBack && !options?.title && !options?.trailing;

  return (
    <div style={{ padding: "4px" }}>
      {canGoBack && (
        <button
          className="text-primary dark:text-dark-primary flex flex-row items-center"
          onClick={pop}
        >
          <ChevronLeftIcon className="size-6" />
          Back
        </button>
      )}
      {options?.title && (
        <div className="text-md line-clamp-1">{options?.title}</div>
      )}
    </div>
  );
}
