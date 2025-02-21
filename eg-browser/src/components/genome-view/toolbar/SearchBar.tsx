import React, { ReactElement, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useElementGeometry } from '@/lib/hooks/useElementGeometry';
import { useDispatch, useSelector } from 'react-redux';
import {
    selectSuggestions,
    setSearchQuery,
    SearchSuggestion,
    selectSlashCommand,
    selectSearchHistory,
    addToSearchHistory,
    clearSearchHistory
} from '@/lib/redux/slices/searchSlice';
import { debounce } from 'lodash';

interface SearchBarProps {
    isSearchFocused: boolean;
    onSearchFocusChange: (focused: boolean) => void;
    onRegionSubmit?: (region: string) => void;
    onGeneSelect?: (gene: GeneResult) => void;
    onSnpSelect?: (snp: SnpResult) => void;
}

type CommandType = 'gene' | 'snp';

interface GeneResult {
    id: string;
    symbol: string;
    type: 'gene';
    description: string;
}

interface SnpResult {
    id: string;
    rsId: string;
    type: 'snp';
    description: string;
}

type SearchResult = GeneResult | SnpResult;

const SLASH_COMMANDS: CommandType[] = ['gene', 'snp'];

const typeToEmoji: Record<CommandType, string> = {
    gene: '🧬',
    snp: '🔍'
};

const mockGeneSearch = async (query: string): Promise<GeneResult[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    if (!query) return [];

    return [
        { id: '1', symbol: 'TP53', type: 'gene' as const, description: 'Tumor protein p53' },
        { id: '2', symbol: 'BRCA1', type: 'gene' as const, description: 'Breast cancer type 1' },
        { id: '3', symbol: query.toUpperCase(), type: 'gene' as const, description: 'Matching gene' },
    ].filter(gene => gene.symbol.toLowerCase().includes(query.toLowerCase()));
};

const mockSnpSearch = async (query: string): Promise<SnpResult[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    if (!query) return [];

    return [
        { id: '1', rsId: 'rs1234567', type: 'snp' as const, description: 'Common variant' },
        { id: '2', rsId: 'rs7582141', type: 'snp' as const, description: 'Known pathogenic' },
        { id: '3', rsId: query.startsWith('rs') ? query : `rs${query}`, type: 'snp' as const, description: 'Matching variant' },
    ].filter(snp => snp.rsId.toLowerCase().includes(query.toLowerCase()));
};

const REGION_REGEX = /^(chr)?(\d+|[XYxy]):(\d+)-(\d+)$/;

function SearchSuggestionDivider({ text }: { text: string }) {
    return (
        <div className="flex items-center my-1 px-4">
            <div className="text-gray-500 text-sm">{text}</div>
        </div>
    );
}

function SearchSuggestionBase({
    icon,
    text,
    desc,
    onClick,
}: {
    icon: React.ReactNode;
    text: string;
    desc: string;
    onClick: () => void;
}) {
    return (
        <div
            className="cursor-pointer hover:bg-gray-100 p-2 rounded-lg flex items-center gap-2"
            onClick={onClick}
        >
            <div className="flex-shrink-0">{icon}</div>
            <div>
                <div className="text-sm font-medium">{text}</div>
                <div className="text-xs text-gray-500">{desc}</div>
            </div>
        </div>
    );
}

export default function SearchBar({ isSearchFocused, onSearchFocusChange, onRegionSubmit, onGeneSelect, onSnpSelect }: SearchBarProps) {
    const { ref: searchContainerRef, height: searchHeight } = useElementGeometry();
    const dispatch = useDispatch();
    const [activeCommand, setActiveCommand] = useState<CommandType | null>(null);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isRegion, setIsRegion] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const searchHistory = useSelector(selectSearchHistory) ?? [];

    const handleSearch = async (query: string) => {
        if (!query) {
            setSearchResults([]);
            setIsRegion(false);
            return;
        }

        if (REGION_REGEX.test(query)) {
            setIsRegion(true);
            setSearchResults([]);
            return;
        }
        setIsRegion(false);

        if (activeCommand === 'gene') {
            const results = await mockGeneSearch(query);
            setSearchResults(results);
        } else if (activeCommand === 'snp') {
            const results = await mockSnpSearch(query);
            setSearchResults(results);
        } else {
            const [geneResults, snpResults] = await Promise.all([
                mockGeneSearch(query),
                mockSnpSearch(query)
            ]);
            setSearchResults([...geneResults, ...snpResults]);
        }
    };

    const debouncedSearch = debounce(handleSearch, 300);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchInput(value);

        if (value.startsWith('/')) {
            const command = value.slice(1) as CommandType;
            if (SLASH_COMMANDS.includes(command)) {
                setActiveCommand(command);
                setSearchInput('');
                return;
            }
        }

        debouncedSearch(value);
    };

    const handleResultClick = (result: SearchResult) => {
        if (result.type === 'gene' && onGeneSelect) {
            onGeneSelect(result);
        } else if (result.type === 'snp' && onSnpSelect) {
            onSnpSelect(result);
        }
        setSearchResults([]);
        setActiveCommand(null);
        setSearchInput('');
    };

    const renderSearchSuggestions = (): ReactElement[] => {
        const suggestions: ReactElement[] = [];

        if (isRegion) {
            suggestions.push(
                <SearchSuggestionBase
                    key="region-message"
                    icon={<span className="text-xl">🎯</span>}
                    text={`"${searchInput}"`}
                    desc="You're entering coordinates. Press enter or click here to jump to this region."
                    onClick={() => onRegionSubmit?.(searchInput)}
                />
            );
            return suggestions;
        }

        if (!activeCommand && !searchResults.length) {
            suggestions.push(
                <SearchSuggestionDivider key="filters" text="Filters" />
            );
            SLASH_COMMANDS.forEach((command) => {
                suggestions.push(
                    <motion.div
                        key={`command-${command}`}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                        whileHover={{ backgroundColor: '#f3f4f6' }}
                        onClick={() => setActiveCommand(command)}
                    >
                        <span className="text-xl">{typeToEmoji[command]}</span>
                        <span className="text-sm text-gray-600">/{command}</span>
                    </motion.div>
                );
            });
        }

        if (searchResults.length > 0) {
            const geneResults = searchResults.filter((r): r is GeneResult => r.type === 'gene');
            const snpResults = searchResults.filter((r): r is SnpResult => r.type === 'snp');

            if (geneResults.length > 0) {
                suggestions.push(
                    <SearchSuggestionDivider key="genes" text="Genes" />
                );
                geneResults.forEach((result) => {
                    suggestions.push(
                        <motion.div
                            key={`gene-${result.id}`}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            whileHover={{ backgroundColor: '#f3f4f6' }}
                            onClick={() => handleResultClick(result)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{result.symbol}</span>
                                <span className="text-xs text-gray-500">{result.description}</span>
                            </div>
                        </motion.div>
                    );
                });
            }

            if (snpResults.length > 0) {
                suggestions.push(
                    <SearchSuggestionDivider key="snps" text="Variants" />
                );
                snpResults.forEach((result) => {
                    suggestions.push(
                        <motion.div
                            key={`snp-${result.id}`}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            whileHover={{ backgroundColor: '#f3f4f6' }}
                            onClick={() => handleResultClick(result)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{result.rsId}</span>
                                <span className="text-xs text-gray-500">{result.description}</span>
                            </div>
                        </motion.div>
                    );
                });
            }
        }

        return suggestions;
    };

    return (
        <motion.div
            ref={searchContainerRef}
            className='flex flex-col relative'
            animate={{ height: searchHeight }}
            transition={{ duration: 0.2 }}
        >
            <AnimatePresence>
                {isSearchFocused && (
                    <motion.div
                        className="absolute bottom-full left-0 right-0 bg-white rounded-lg shadow-lg mb-2 overflow-hidden z-50"
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {renderSearchSuggestions()}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className='flex flex-row items-center'>
                <div className='flex flex-row items-center px-2 py-2 w-full'>
                    {activeCommand ? (
                        <div className="flex items-center bg-secondary px-2 py-1 rounded-lg -ml-1">
                            <span className="text-sm text-tint">/{activeCommand}</span>
                        </div>
                    ) : (
                        <MagnifyingGlassIcon className='w-5 h-5 text-gray-400 flex-shrink-0' />
                    )}
                    <input
                        className='flex-1 outline-none bg-transparent ml-2 text-base'
                        placeholder={activeCommand ? `Search ${activeCommand}s...` : "Search genes, variants, or regions..."}
                        onFocus={() => onSearchFocusChange(true)}
                        onBlur={() => onSearchFocusChange(false)}
                        onChange={handleSearchChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !e.currentTarget.value && activeCommand) {
                                setActiveCommand(null);
                            } else if (e.key === 'Enter' && isRegion && onRegionSubmit) {
                                onRegionSubmit(e.currentTarget.value);
                            }
                        }}
                    />
                    {isRegion && (
                        <button
                            onClick={() => onRegionSubmit?.(document.querySelector('input')?.value || '')}
                            className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary hover:bg-opacity-80 transition-colors"
                        >
                            <ArrowRightIcon className="w-4 h-4 text-tint" />
                        </button>
                    )}
                </div>
                <motion.div
                    className='w-full absolute bottom-0 border-b border-gray-300'
                    animate={{ opacity: isSearchFocused ? 0 : 1 }}
                    transition={{ duration: 0.2 }}
                />
            </div>
        </motion.div>
    );
}
