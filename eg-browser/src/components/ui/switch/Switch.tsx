import classNames from "classnames";
import { CheckIcon } from "@heroicons/react/24/solid";

export default function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div
      className={classNames(
        "flex items-center gap-2 w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-300",
        checked
          ? "bg-secondary outline-none"
          : "bg-gray-100 outline outline-2 outline-gray-400"
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
        {checked && <CheckIcon className="w-4 h-4 text-gray-400" />}
      </div>
    </div>
  );
}
