import { useAppDispatch } from "@/lib/redux/hooks"
import { useEffect, useMemo, useState } from "react";
import Button from "../ui/button/Button";
import { useNavigation } from "../core-navigation/NavigationStack";
import { addCustomGenome } from "@/lib/redux/thunk/genome-hub";
import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import FileInput from "../ui/input/FileInput";
import GenomeSerializer from "@eg/tracks/src/genome-hub/GenomeSerializer";

export default function AddCustomGenome() {
    const dispatch = useAppDispatch();
    const navigation = useNavigation();
    const [file, setFile] = useState<File | null>(null);
    const [validationErrors, setValidationErrors] = useState<ReturnType<typeof GenomeSerializer.validateGenomeObject> | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (file) {
            (async () => {
                setIsLoading(true);
                try {
                    const json = await file.text();
                    const parsedJson = JSON.parse(json);
                    const errors = GenomeSerializer.validateGenomeObject(parsedJson);
                    setValidationErrors(errors);
                } catch (error) {
                    console.error(error);
                    setValidationErrors({
                        valid: false,
                        errors: [{
                            keyword: "parse",
                            instancePath: "",
                            schemaPath: "#",
                            params: {},
                            message: "Invalid JSON format"
                        }]
                    });
                } finally {
                    setIsLoading(false);
                }
            })();
        }
    }, [file]);

    useEffect(() => {
        if (file && validationErrors?.valid) {
            dispatch(addCustomGenome(file));
            navigation.pop();
        }
    }, [file, validationErrors]);

    const renderValidationErrors = () => {
        if (!validationErrors || validationErrors.valid || !validationErrors.errors) {
            return null;
        }

        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                <h3 className="text-red-800 font-medium mb-2">Validation Errors:</h3>
                <ul className="list-disc pl-5 text-red-700 text-sm">
                    {validationErrors.errors.map((error: any, index: number) => (
                        <li key={index} className="mb-1">
                            {error.instancePath && <span className="font-mono text-xs">{error.instancePath}</span>}{' '}
                            {error.message}
                            {error.params?.missingProperty && (
                                <span className="font-mono text-xs"> (missing: '{error.params.missingProperty}')</span>
                            )}
                            {error.params?.additionalProperty && (
                                <span className="font-mono text-xs"> (extra: '{error.params.additionalProperty}')</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        );
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
                    style={{ color: "#5F6368" }}
                >
                    View Schema
                </Button>
                <Button
                    leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                    onClick={() => {
                        const link = document.createElement('a');
                        link.href = import.meta.env.BASE_URL + '/example_hg19.json';
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
            {isLoading ? (
                <div className="text-center py-2">Validating...</div>
            ) : (
                renderValidationErrors()
            )}
        </div>
    )
}
