import { useMemo, useState } from "react";
import { useAppDispatch } from "../../lib/redux/hooks";
import { getSpeciesInfo, GENOME_LIST } from "../genome-picker/genome-list";
import { getGenomeConfig, GenomeSerializer } from "wuepgg3-track";
import { createSession } from "@/lib/redux/slices/browserSlice";
import placeholder from "../../assets/placeholder.png";
import useExpandedNavigationTab from "@/lib/hooks/useExpandedNavigationTab";


type Props = {
    onClose?: () => void;
};

export default function TabGenomePicker({ onClose }: Props) {
    useExpandedNavigationTab()
    const dispatch = useAppDispatch();
    const [search, setSearch] = useState<string>("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return GENOME_LIST;
        return GENOME_LIST.filter((g) =>
            g.name.toLowerCase().includes(q) ||
            g.versions.some((v) => v.toLowerCase().includes(q)),
        );
    }, [search]);

    const pick = (assemblyName: string) => {
        const config = getGenomeConfig(assemblyName);
        if (config) {
            dispatch(createSession({ genome: GenomeSerializer.serialize(config) }));
        }
        if (onClose) onClose();
    };

    const resolveUrl = (url?: string | null) => {
        if (!url) return undefined;
        if (url.startsWith("http")) return url;
        try {
            // Vite provides import.meta.env.BASE_URL
            // fall back to "/browser/" when not available
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const base = import.meta && import.meta.env && import.meta.env.BASE_URL ? import.meta.env.BASE_URL : "/browser/";
            return base + url;
        } catch (e) {
            return "/browser/" + url;
        }
    };
    const speciesInfo = useMemo(() => {
        if (!filtered.length) return { name: "", logo: "" };
        return getSpeciesInfo(filtered[0].versions[0]);
    }, [filtered]);
    return (
        <div className="p-2 w-full">
            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search genomes..."
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-dark-background text-gray-800 dark:text-dark-primary outline-none focus:border-blue-400"
                    autoFocus
                />
            </div>

            <div>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                    {filtered.map((g) => {
                        const logoUrl = g.logoUrl


                        const resolved = resolveUrl(logoUrl) || placeholder;


                        return (
                            <div key={g.name} className="flex flex-col gap-2 p-2 rounded">
                                <div className="flex items-center w-full">
                                    <div
                                        style={{
                                            backgroundImage: resolved ? `url(${resolved})` : undefined,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            backgroundRepeat: "no-repeat",
                                            opacity: resolved ? 0.8 : 1,
                                            width: "140px",
                                            height: "36px",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (resolved) (e.currentTarget as HTMLElement).style.opacity = "1";
                                        }}
                                        onMouseLeave={(e) => {
                                            if (resolved) (e.currentTarget as HTMLElement).style.opacity = "0.8";
                                        }}
                                        className={
                                            "z-10 rounded-sm transition-opacity relative overflow-hidden cursor-pointer flex-shrink-0 " +
                                            (resolved ? "outline outline-gray-200" : "")
                                        }
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span
                                                className="leading-tight text-center break-words w-full"
                                                style={{
                                                    color: resolved ? "white" : undefined,
                                                    fontSize: "14px",
                                                }}
                                            >
                                                <span className={resolved ? "" : "text-gray-700 dark:text-dark-primary"}>
                                                    {g?.name ? (
                                                        <>

                                                            <i>{g.name}</i>
                                                        </>
                                                    ) : (
                                                        <i>{g.name}</i>
                                                    )}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-1 w-full " style={{ width: "140px" }}>
                                    {g.versions.map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => pick(v)}
                                            className="w-full text-left text-xs italic px-2 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-dark-secondary border border-gray-200 dark:border-gray-600 rounded transition-colors"
                                            title={v}

                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
