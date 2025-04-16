import classNames from "classnames";

export default function Button({
  children,
  onClick,
  leftIcon,
  active = false,
  disabled = false,
  backgroundColor = "secondary",
  style,
  outlined = false,
}: {
  children: string;
  leftIcon?: React.ReactNode;
  onClick?: (event: React.MouseEvent) => void;
  active?: boolean;
  backgroundColor?: "secondary" | "tint" | "alert";
  outlined?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const _onClick = (event: React.MouseEvent) => {
    if (disabled) return;
    onClick?.(event);
  };

  return (
    <button
      className={classNames(
        "px-2 py-2 rounded-2xl flex items-center justify-center text-primary dark:text-dark-primary",
        active && "bg-secondary dark:bg-dark-secondary",
        disabled && "bg-slate-200",
        outlined && "border border-primary",
        backgroundColor === "tint" && "bg-tint dark:bg-dark-tint text-white",
        backgroundColor === "alert" && "bg-alert text-white"
      )}
      onClick={_onClick}
      style={style}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
    </button>
  );
}
