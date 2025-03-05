import { useAppDispatch } from "@/lib/redux/hooks"
import { useEffect, useState } from "react";
import Button from "../ui/button/Button";
import { useNavigation } from "../core-navigation/NavigationStack";
import { addCustomGenome } from "@/lib/redux/thunk/genome-hub";

export default function AddCustomGenome() {
    const dispatch = useAppDispatch();
    const navigation = useNavigation();
    const [file, setFile] = useState<File | null>(null);

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="w-full border-dashed border-2 border-gray-400 rounded-md h-52 flex flex-col items-center justify-center cursor-pointer">
                <h2>Drag and drop a genome file here</h2>
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
