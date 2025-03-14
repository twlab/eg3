import { useRef } from "react";

export default function FileInput({
    onFileChange,
    accept = "*",
    className = "",
    children,
    dragMessage = "Drag and drop a file here",
    clickMessage = "Click to select a file",
    orMessage = "- or -"
}: {
    onFileChange: (file: File | null) => void;
    accept?: string;
    className?: string;
    children?: React.ReactNode;
    dragMessage?: string;
    clickMessage?: string;
    orMessage?: string;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] || null;
        onFileChange(selectedFile);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile && (!accept || droppedFile.name.endsWith(accept))) {
            onFileChange(droppedFile);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <>
            <input
                type="file"
                accept={accept}
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <div
                className={`w-full border-dashed border-2 border-gray-400 rounded-md h-52 flex flex-col items-center justify-center cursor-pointer ${className}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {children || (
                    <>
                        <h2>{dragMessage}</h2>
                        <p>{orMessage}</p>
                        <h2>{clickMessage}</h2>
                    </>
                )}
            </div>
        </>
    );
}
