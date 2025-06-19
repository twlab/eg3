import classNames from "classnames";

export default function IconButton({
    children,
    onClick,
    active = false,
    disabled = false,
    title,
    className = "",
}: {
    children: React.ReactNode;
    onClick?: (event: React.MouseEvent) => void;
    active?: boolean;
    disabled?: boolean;
    title?: string;
    className?: string;
}) {
    const _onClick = (event: React.MouseEvent) => {
        if (disabled) return;
        onClick?.(event);
    }

    return (
        <button
            className={classNames(
                "text-primary p-2 rounded-2xl flex items-center justify-center",
                active && "bg-secondary",
                // disabled && "bg-slate-400",
                className
            )}
            onClick={_onClick}
            title={title}
            disabled={disabled}
        >
            {children}
        </button>
    );
} 