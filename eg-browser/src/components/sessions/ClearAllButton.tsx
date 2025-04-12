import { TrashIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react';

export default function ClearAllButton({
    onClearAll
}: {
    onClearAll: () => void;
}) {
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);

            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setCountdown(null);
            setIsConfirmed(true);
        }
    }, [countdown]);

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
        } else if (countdown === null) {
            setCountdown(3);
        }
    };

    const getBackgroundColor = () => {
        if (isConfirmed) return "bg-alert";
        if (countdown !== null) return "bg-gray-200 dark:bg-dark-surface";
        return "bg-secondary dark:bg-dark-secondary";
    };

    const getIconColor = () => {
        if (isConfirmed) return "text-white";
        if (countdown !== null) return "text-gray-500 dark:text-dark-primary";
        return "text-primary dark:text-dark-primary";
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 gap-4">
            <h1 className="text-xl">Clear All</h1>
            <div
                className={`size-12 flex flex-row items-center justify-center ${getBackgroundColor()} rounded-full cursor-pointer transition-colors duration-200 ${getIconColor()}`}
                onClick={handleClick}
            >
                {isConfirmed ? (
                    <CheckIcon className="size-6" />
                ) : countdown !== null ? (
                    <span className="text-lg font-semibold">{countdown}</span>
                ) : (
                    <TrashIcon className="size-6" />
                )}
            </div>
        </div>
    )
}
