import { CheckIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react';

export default function ClearAllButton({
    onClearAll,
    compact = false,
    title = ""
}: {
    onClearAll: () => void;
    compact?: boolean;
    title: string;
}) {

    const [isConfirmed, setIsConfirmed] = useState<boolean>(false);



    useEffect(() => {
        if (isConfirmed) {
            const resetTimer = setTimeout(() => {
                setIsConfirmed(false);
            }, 3000);

            return () => clearTimeout(resetTimer);
        }
    }, [isConfirmed]);

    const handleClick = () => {
        if (isConfirmed) {
            onClearAll();
            setIsConfirmed(false);
        } else {
            // Skip the countdown and immediately show the confirm checkmark

            setIsConfirmed(true);
        }
    };

    const getBackgroundColor = () => {
        if (isConfirmed) return "bg-alert";

        return "bg-secondary dark:bg-dark-secondary";
    };

    const getIconColor = () => {
        if (isConfirmed) return "text-white";

        return "text-primary dark:text-dark-primary";
    }

    if (compact) {
        return (
            <button
                onClick={handleClick}
                title={isConfirmed ? "Confirm clear all" : title}
                className={`py-1 rounded-md inline-flex items-center justify-center gap-1 text-md transition-colors duration-200 min-w-0 w-[140px] ${getBackgroundColor()} ${getIconColor()} hover:bg-red-200 dark:hover:bg-red-700`}
            >
                {isConfirmed ? (
                    <CheckIcon className="w-5 h-5" />
                ) : null}
                <span className="truncate text-center">{isConfirmed ? "Confirm" : title}</span>
            </button>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 gap-4">
            <h1 className="text-lg">{title}</h1>
            <div
                className={`size-12 flex flex-row items-center justify-center ${getBackgroundColor()} rounded-full cursor-pointer transition-colors duration-200 ${getIconColor()} hover:bg-red-200 dark:hover:bg-red-700`}
                onClick={handleClick}
            >
                {isConfirmed ? (
                    <CheckIcon className="size-6" />
                ) : null}
            </div>
        </div>
    )
}
