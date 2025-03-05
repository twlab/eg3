import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectCustomGenomes, selectCustomGenomesLoadStatus } from "@/lib/redux/slices/genomeHubSlice";
import { refreshLocalGenomes } from "@/lib/redux/thunk/genome-hub";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

import { useNavigation } from "../core-navigation/NavigationStack";
import Button from "../ui/button/Button";
import EmptyView from "../ui/empty/EmptyView";

export default function GenomeHubPanel() {
    const dispatch = useAppDispatch();
    const customGenomes = useAppSelector(selectCustomGenomes);
    const customGenomesLoadStatus = useAppSelector(selectCustomGenomesLoadStatus);

    const navigation = useNavigation();

    useEffect(() => {
        if (customGenomesLoadStatus === "idle") {
            dispatch(refreshLocalGenomes());
        }
    }, [dispatch, customGenomesLoadStatus]);

    return (
        <div className="flex flex-col pt-2 h-full">
            <div className="flex flex-row gap-2 w-full justify-start items-center">
                <Button
                    leftIcon={<PlusIcon className="w-4 h-4" />}
                    active
                    onClick={() => {
                        navigation.push({
                            path: "add-custom-genome",
                        })
                    }}
                >
                    Add Custom Genome
                </Button>
            </div>
            {customGenomes.length === 0 ? (
                <EmptyView
                    title="No Custom Genomes"
                    description="Custom genomes are stored locally in your browser. Add a custom genome and it will appear here."
                />
            ) : (
                <div>
                    <p>Custom Genomes</p>
                </div>
            )}
        </div>
    )
}
