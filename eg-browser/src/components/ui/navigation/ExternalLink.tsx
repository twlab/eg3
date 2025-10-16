import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid";

interface ExternalLinkProps {
  title: string;
  description?: string;
  href: string;
}

export default function ExternalLink({
  title,
  description,
  href,
}: ExternalLinkProps) {
  const handleClick = () => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

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
