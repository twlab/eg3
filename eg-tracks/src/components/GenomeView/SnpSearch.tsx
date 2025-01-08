import { useState, useRef, useEffect } from 'react';
import ChromosomeInterval from '@/models/ChromosomeInterval';

const DEBOUNCE_INTERVAL = 250;

const SNP_ENDPOINTS = {
    hg19: "https://grch37.rest.ensembl.org/variation/human",
    hg38: "https://rest.ensembl.org/variation/human",
};

interface SnpSearchProps {
    genomeArr: any[];
    genomeIdx: number;
    onRegionSelected: (startBase: number, endBase: number, toolTitle?: string) => void;
    addGlobalState: (state: any) => void;
    trackManagerState: any;
}

export default function SnpSearch({
    genomeArr,
    genomeIdx,
    onRegionSelected,
    addGlobalState,
    trackManagerState
}: SnpSearchProps) {
    const [inputValue, setInputValue] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loadingMsg, setLoadingMsg] = useState("");
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setResult(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    async function searchSnp() {
        const input = inputValue.trim();
        if (input.length < 1) {
            alert("Please input a valid SNP id.");
            return;
        }

        const genomeName = genomeArr[genomeIdx].genome.getName();
        const endpoint = SNP_ENDPOINTS[genomeName];

        if (!endpoint) {
            alert("This genome is not supported in SNP search.");
            return;
        }

        setLoadingMsg("searching...");

        try {
            const response = await fetch(`${endpoint}/${input}`, {
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (error) {
            alert("Error searching for SNP");
            console.error("SNP search error:", error);
        } finally {
            setLoadingMsg("");
        }
    }

    function setViewToSnp(entry: any) {
        const locationMatch = entry.location.match(/(\d+):(\d+)-(\d+)/);
        if (!locationMatch) {
            alert("Invalid location format");
            return;
        }

        const [_, chrNum, start, end] = locationMatch;
        const chrInterval = new ChromosomeInterval(
            `chr${chrNum}`,
            parseInt(start) - 1,
            parseInt(end)
        );

        const interval = genomeArr[genomeIdx].navContext.convertGenomeIntervalToBases(chrInterval)[0];

        if (interval) {
            onRegionSelected(interval.start, interval.end, "Zoom in 5-fold");

            const newHighlight = {
                start: interval.start,
                end: interval.end,
                display: true,
                color: "rgba(0, 123, 255, 0.15)",
                tag: inputValue.trim(),
            };

            let newStateObj = { ...trackManagerState.current };
            newStateObj.highlights = [...newStateObj.highlights, newHighlight];
            addGlobalState(newStateObj);
        } else {
            alert("SNP not available in current region set view");
        }
    }

    const renderSNP = (snp: any) => {
        return (
            <table className="table-auto border-collapse w-full">
                <tbody>
                    <tr className="border-b">
                        <td className="p-2 font-semibold">name</td>
                        <td className="p-2">{snp.name}</td>
                    </tr>
                    <tr className="border-b">
                        <td className="p-2 font-semibold">location</td>
                        <td className="p-2">
                            {snp.mappings.map((item: any, i: number) => (
                                <div
                                    key={i}
                                    className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                                    onClick={() => setViewToSnp(item)}
                                >
                                    chr{item.location} {item.strand === 1 ? "+" : "-"} {item.allele_string}
                                </div>
                            ))}
                        </td>
                    </tr>
                    <tr className="border-b">
                        <td className="p-2 font-semibold">ambiguity</td>
                        <td className="p-2">{snp.ambiguity}</td>
                    </tr>
                    <tr className="border-b">
                        <td className="p-2 font-semibold">ancestral allele</td>
                        <td className="p-2">{snp.ancestral_allele}</td>
                    </tr>
                </tbody>
            </table>
        );
    };

    return (
        <div className="relative">
            <div className="flex gap-2 items-center">
                <input
                    type="text"
                    className="px-2 py-1 border rounded"
                    placeholder="SNP id"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            searchSnp();
                        }
                    }}
                />
                <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={searchSnp}
                >
                    Go
                </button>
                <span className="text-blue-600 italic">{loadingMsg}</span>
            </div>
            {result && (
                <div
                    ref={popupRef}
                    className="absolute z-10 mt-2 bg-white border rounded shadow-lg p-4 max-w-2xl"
                >
                    {renderSNP(result)}
                </div>
            )}
        </div>
    );
} 