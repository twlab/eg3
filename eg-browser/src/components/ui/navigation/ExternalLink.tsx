import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid";

interface ExternalLinkProps {
  title: string;
  description?: string;
  href: string;
  compact?: boolean;
}

export default function ExternalLink({
  title,
  description,
  href,
  compact = false,
}: ExternalLinkProps) {
  const handleClick = () => {
    window.open(href, "_blank", "noopener,noreferrer");
  };
  if (compact) {
    return (
      <div onClick={handleClick} className="flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-base">
        <div className="text-primary dark:text-dark-primary font-medium">{title}</div>
        <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-500 dark:text-gray-300" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-row gap-4 bg-secondary dark:bg-dark-secondary dark:text-dark-primary p-4 rounded-xl justify-between items-center cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-xl">{title}</h1>
        {description && <p className="text-sm">{description}</p>}
      </div>
      <div>
        <ArrowTopRightOnSquareIcon className="size-6" />
      </div>
    </div>
  );
}
