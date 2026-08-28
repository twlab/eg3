import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * The round X that closes the session panel.
 *
 * Split out from `SessionToggleButton`, which pairs the icon with a title and a
 * count and is what *opens* the panel from the nav bar. Once the panel is open
 * the title has a home of its own in the panel header, so all that is left to
 * render is the dismiss affordance.
 */
export default function ClosePanelButton({
  onClick,
  title = "Close panel",
}: {
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      className="shrink-0 inline-flex items-center justify-center rounded-md p-1 text-red-600 outline-none cursor-pointer transition-colors duration-150 hover:bg-red-100 dark:hover:bg-red-700 dark:hover:text-white"
    >
      <XMarkIcon className="w-5 h-5" />
    </button>
  );
}
