import classNames from "classnames";
import { CheckIcon } from "@heroicons/react/24/solid";
import { type ReactNode } from "react";

export default function Switch({
  checked,
  onChange,
  checkedIcon,
  uncheckedIcon,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  checkedIcon?: ReactNode;
  uncheckedIcon?: ReactNode;
}) {
  return (
    <div
      className={classNames(
        "flex items-center gap-2 w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-300",
        checked
          ? "bg-secondary dark:bg-dark-secondary outline-none"
          : "bg-gray-100 dark:bg-dark-surface outline outline-2 outline-gray-400"
      )}
      onClick={() => onChange(!checked)}
    >
      <div
        className={classNames(
          "rounded-full transition-all duration-300 flex items-center justify-center",
          checked
            ? "bg-white w-6 h-6 translate-x-6"
            : "bg-gray-400 w-5 h-5 translate-x-0.5"
        )}
      >
        {checked
          ? (checkedIcon ?? <CheckIcon className="w-4 h-4 text-gray-400" />)
          : uncheckedIcon}
      </div>
    </div>
  );
}
