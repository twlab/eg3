import classNames from "classnames";

export default function Button({
    children,
    onClick,
    active = false,
}: {
    children: string;
    onClick?: () => void;
    active?: boolean;
}) {


    return (
        <button className={classNames("text-primary px-2 py-2 rounded-2xl", active && "bg-secondary")} onClick={onClick}>
            {children}
        </button>
    );
}
