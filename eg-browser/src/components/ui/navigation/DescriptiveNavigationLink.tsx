import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { useNavigation } from "../../core-navigation/NavigationStack";

export default function DescriptiveNavigationLink({
  title,
  description,
  path,
  onClick,
  params,
  compact = false,
}: {
  title: string;
  description?: string;
  path?: string;
  onClick?: () => void;
  params?: Record<string, string>;
  compact?: boolean;
}) {
  const { push } = useNavigation();

  const handleClick = () => {
    if (path) {
      push({ path, params });
    } else if (onClick) {
      onClick();
    }
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-base"
      >
        <div className="text-primary dark:text-dark-primary font-sm">{title}</div>
        <ChevronRightIcon className="h-5 w-5 text-gray-500 dark:text-gray-300" />
      </div>
    );
  }

  return (
    <div
      className="text-primary flex flex-row gap-2 bg-secondary dark:bg-dark-secondary p-2 rounded-xl justify-between items-center cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-sm text-primary dark:text-dark-primary">{title}</h1>
        {description && (
          <p className="text-sm dark:text-dark-primary">{description}</p>
        )}
      </div>
      <div>
        <ChevronRightIcon className="size-6 text-primary dark:text-dark-primary" />
      </div>
    </div>
  );
}
