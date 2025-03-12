import classNames from "classnames";

export default function Button({
  children,
  onClick,
  leftIcon,
  active = false,
  disabled = false,
  style,
  outlined = false,
}: {
  children: string;
  leftIcon?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  outlined?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const _onClick = () => {
    // if (disabled) return;
    onClick?.();
  };

  return (
    <button
      className={classNames(
        "text-primary px-2 py-2 rounded-2xl flex items-center justify-center",
        active && "bg-secondary",
        disabled && "bg-slate-200",
        outlined && "border border-primary"
      )}
      onClick={_onClick}
      style={style}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
    </button>
  );
}
