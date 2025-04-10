import { useMemo, useState } from 'react';
import { useElementGeometry } from '@/lib/hooks/useElementGeometry';
import { PlusIcon, CheckIcon } from "@heroicons/react/24/solid";

export interface ICollectionViewDataSource<T> {
    section?: string;
    id: string;
    title: string;
    data: T;
}

interface IGroupedData<T> {
    name: string;
    items: ICollectionViewDataSource<T>[];
}

export default function CollectionView<T>({
    data,
    onSelect,
    selectedIds,
}: {
    data: ICollectionViewDataSource<T>[];
    onSelect: (element: ICollectionViewDataSource<T>) => void;
    selectedIds?: Set<string>;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const searchBarGeometry = useElementGeometry();

    const filteredData = useMemo(() => {
        if (!searchQuery) return data;

        return data.filter(item => {
            const searchableValues = [
                item.title,
                item.id,
                item.section,
                ...Object.values(item.data as object || {})
            ];

            return searchableValues.some(value =>
                String(value).toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
    }, [data, searchQuery]);

    const organizedData = useMemo(() => {
        const hasAnySections = filteredData.some(item => item.section !== undefined);

        if (!hasAnySections) {
            return [{ name: '', items: filteredData }];
        }

        const grouped: Record<string, ICollectionViewDataSource<T>[]> = {};

        filteredData.forEach(item => {
            const sectionName = item.section || 'Other';
            if (!grouped[sectionName]) {
                grouped[sectionName] = [];
            }
            grouped[sectionName].push(item);
        });

        return Object.entries(grouped)
            .map(([name, items]) => ({
                name,
                items
            }))
            .filter(group => group.items.length > 0);
    }, [filteredData]);

    const renderSearchBar = () => (
        <div
            ref={searchBarGeometry.ref}
            className="sticky top-0 z-20 pb-2 flex items-center"
            style={{ backgroundColor: "var(--bg-container-color)" }}
        >
            <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-1 border border-gray-300 rounded-full"
            />
        </div>
    );

    const renderItem = (item: ICollectionViewDataSource<T>) => (
        <div
            key={item.id}
            className="flex items-center justify-between py-1 max-w-full min-w-0 gap-2"
        >
            <span
                className="text-sm truncate min-w-0 flex-1"
                title={item.title}
            >
                {item.title}
            </span>
            {selectedIds !== undefined && (
                <>
                    {selectedIds.has(item.id) ? (
                        <div className="w-6 h-6 rounded-md bg-green-200 flex items-center justify-center flex-shrink-0">
                            <CheckIcon className="w-4 h-4" />
                        </div>
                    ) : (
                        <button
                            className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center hover:bg-purple-200 flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(item);
                            }}
                        >
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    )}
                </>
            )}
        </div>
    );

    const renderGroup = (group: IGroupedData<T>) => (
        <div key={group.name} className="mb-4 relative">
            {group.name && (
                <h2
                    className="text-base font-medium mb-1 sticky z-10 pb-1"

                    style={{ top: `${searchBarGeometry.height}px`, backgroundColor: "var(--bg-container-color)" }}
                >
                    {group.name}
                </h2>
            )}
            <div className={group.name ? "pl-3 border-l border-gray-200" : ""}>
                {group.items.map(item => renderItem(item))}
            </div>
        </div>
    );

    return (
        <div className="max-w-full">
            {renderSearchBar()}
            {organizedData.map(group => renderGroup(group))}
        </div>
    );
}
