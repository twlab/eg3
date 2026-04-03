import Logo from "@/assets/logo.png";

export default function EmptyView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col flex-1  items-center text-primary dark:text-dark-primary">
      <img src={Logo} alt="logo" className="size-12" />
      <p className="text-lg">{title}</p>
      <p className="text-center">{description}</p>
    </div>
  );
}
