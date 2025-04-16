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
    <div
      className={`${navigationBarEmpty ? "h-4" : "p-4"
        } flex flex-row justify-between items-center gap-2`}
    >
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
        <h1 className="text-xl line-clamp-1">{options?.title}</h1>
      )}
      {options?.trailing
        ? options.trailing
        : canGoBack && (
          <button
            className="text-primary dark:text-dark-primary flex flex-row items-center invisible"
            onClick={pop}
          >
            <ChevronLeftIcon className="size-6" />
            Back
          </button>
        )}
    </div>
  );
}
