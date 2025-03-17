import { useAppDispatch } from "@/lib/redux/hooks"
import { useEffect, useMemo, useState } from "react";
import Button from "../ui/button/Button";
import { useNavigation } from "../core-navigation/NavigationStack";
import { addCustomGenome } from "@/lib/redux/thunk/genome-hub";
import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import FileInput from "../ui/input/FileInput";

export default function AddCustomGenome() {
    const dispatch = useAppDispatch();
    const navigation = useNavigation();
    const [file, setFile] = useState<File | null>(null);

    const validationErrors = useMemo(() => {
        return [];
    }, [file]);

    useEffect(() => {
        if (file && validationErrors.length === 0) {
            dispatch(addCustomGenome(file));
            navigation.pop();
        }
    }, [file, validationErrors]);

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
            <FileInput
                accept=".json"
                onFileChange={setFile}
                dragMessage="Drag and drop a .json genome file here"
            />
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
