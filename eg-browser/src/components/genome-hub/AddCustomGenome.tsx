import { useAppDispatch } from "@/lib/redux/hooks"
import { useEffect, useMemo, useState, useRef } from "react";
import Button from "../ui/button/Button";
import { useNavigation } from "../core-navigation/NavigationStack";
import { addCustomGenome } from "@/lib/redux/thunk/genome-hub";
import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function AddCustomGenome() {
    const dispatch = useAppDispatch();
    const navigation = useNavigation();
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validationErrors = useMemo(() => {
        return [];
    }, [file]);

    useEffect(() => {
        if (file && validationErrors.length === 0) {
            dispatch(addCustomGenome(file));
            navigation.pop();
        }
    }, [file, validationErrors]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] || null;
        setFile(selectedFile);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.json')) {
            setFile(droppedFile);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex flex-row gap-2 w-full justify-start items-center">
                <Button
                    leftIcon={<PlusIcon className="w-4 h-4" />}
                    active
                    onClick={() => {
                        navigation.push({
                            path: "genome-schema",
                        })
                    }}
                >
                    View Schema
                </Button>
                <Button
                    leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                    onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/example_hg19.json';
                        link.download = 'example_hg19.json';
                        link.click();
                    }}
                    outlined
                >
                    Download Example
                </Button>
            </div>
            <input
                type="file"
                accept=".json"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <div
                className="w-full border-dashed border-2 border-gray-400 rounded-md h-52 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <h2>Drag and drop a .json genome file here</h2>
                <p>- or -</p>
                <h2>Click to select a file</h2>
            </div>
            <Button
                active
                disabled={!file}
                onClick={() => {
                    if (!file) return;
                    dispatch(addCustomGenome(file));
                    navigation.pop();
                }}
            >
                Add
            </Button>
        </div>
    )
}
