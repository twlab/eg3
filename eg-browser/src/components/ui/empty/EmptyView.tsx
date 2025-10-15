import Logo from "@/assets/logo.png";

export default function EmptyView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4 flex-1  items-center text-primary dark:text-dark-primary">
      <img src={Logo} alt="logo" className="size-16" />
      <h1 className="text-xl">{title}</h1>
      <p className="text-center">{description}</p>
    </div>
  );
}
