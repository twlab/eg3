import classNames from "clsx";
import { CheckIcon } from "@heroicons/react/24/solid";
import { type ReactNode } from "react";

export default function Switch({
  checked,
  onChange,
  checkedIcon,
  uncheckedIcon,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  checkedIcon?: ReactNode;
  uncheckedIcon?: ReactNode;
  /** Accessible name. Without it the control is unreachable by name. */
  label?: string;
}) {
  return (
    <div
      // A bare clickable div is invisible to assistive tech and to anyone
      // navigating by keyboard, and gives tests nothing to target by name.
      role="switch"
      aria-checked={checked}
      aria-label={label}
      tabIndex={0}
      className={classNames(
        "flex items-center w-15 p-1 h-8 rounded-full cursor-pointer transition-all duration-300",
        checked
          ? "bg-secondary dark:bg-dark-secondary"
          : "bg-gray-300 dark:bg-dark-surface"
      )}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
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
