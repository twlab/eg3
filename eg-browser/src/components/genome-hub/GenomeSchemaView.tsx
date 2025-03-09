import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { genomeDataSchema } from "@eg/tracks";
import Button from "../ui/button/Button";

type SchemaNode = {
    type: string;
    required?: string[];
    properties?: Record<string, SchemaNode>;
    items?: SchemaNode;
    enum?: string[];
    minimum?: number;
    patternProperties?: Record<string, SchemaNode>;
    additionalProperties?: boolean;
    oneOf?: SchemaNode[];
};


const SchemaNode: React.FC<{
    node: SchemaNode;
    name: string;
    path: string;
    required?: boolean;
    depth?: number;
}> = ({ node, name, path, required = false, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(depth < 2);

    const hasChildren =
        (node.properties && Object.keys(node.properties).length > 0) ||
        node.items ||
        (node.patternProperties && Object.keys(node.patternProperties).length > 0);

    const toggle = () => setIsExpanded(!isExpanded);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'string': return 'text-green-600';
            case 'integer':
            case 'number': return 'text-blue-600';
            case 'boolean': return 'text-purple-600';
            case 'array': return 'text-yellow-600';
            case 'object': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const renderAdditionalDetails = () => {
        const details = [];

        if (node.enum) {
            details.push(
                <div key="enum" className="ml-4 text-sm text-gray-600">
                    Allowed values: [{node.enum.map(v => `"${v}"`).join(', ')}]
                </div>
            );
        }

        if (node.minimum !== undefined) {
            details.push(
                <div key="min" className="ml-4 text-sm text-gray-600">
                    Minimum: {node.minimum}
                </div>
            );
        }

        if (node.additionalProperties === false) {
            details.push(
                <div key="additionalProps" className="ml-4 text-sm text-gray-600">
                    No additional properties allowed
                </div>
            );
        }

        return details;
    };

    const renderChildren = () => {
        if (!isExpanded) return null;

        const children = [];

        // Render properties
        if (node.properties) {
            const properties = Object.entries(node.properties);
            properties.forEach(([propName, propSchema], index) => {
                const isReq = node.required?.includes(propName) || false;
                children.push(
                    <SchemaNode
                        key={`${path}.${propName}`}
                        node={propSchema}
                        name={propName}
                        path={`${path}.${propName}`}
                        required={isReq}
                        depth={depth + 1}
                    />
                );
            });
        }

        if (node.items) {
            children.push(
                <div key={`${path}.items`} className="ml-8 mt-2">
                    <div className="font-medium">Array items:</div>
                    <SchemaNode
                        node={node.items}
                        name="items"
                        path={`${path}.items`}
                        depth={depth + 1}
                    />
                </div>
            );
        }

        if (node.patternProperties) {
            Object.entries(node.patternProperties).forEach(([pattern, schema]) => {
                children.push(
                    <div key={`${path}.pattern.${pattern}`} className="ml-8 mt-2">
                        <div className="font-medium">Pattern: <span className="font-mono text-orange-600">{pattern}</span></div>
                        <SchemaNode
                            node={schema}
                            name="patternProperty"
                            path={`${path}.pattern.${pattern}`}
                            depth={depth + 1}
                        />
                    </div>
                );
            });
        }

        if (node.oneOf) {
            children.push(
                <div key={`${path}.oneOf`} className="ml-8 mt-2">
                    <div className="font-medium">One of:</div>
                    {node.oneOf.map((schema, index) => (
                        <SchemaNode
                            key={`${path}.oneOf.${index}`}
                            node={schema}
                            name={`option ${index + 1}`}
                            path={`${path}.oneOf.${index}`}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            );
        }

        return children.length > 0 ? <div className="ml-8">{children}</div> : null;
    };

    return (
        <div className={`mt-1 ${depth > 0 ? 'ml-4' : ''}`}>
            <div className="flex items-start">
                {hasChildren ? (
                    <button
                        onClick={toggle}
                        className="mr-1 mt-1 text-gray-500 hover:text-gray-800 focus:outline-none"
                    >
                        {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                        )}
                    </button>
                ) : (
                    <span className="w-5" />
                )}

                <div>
                    <div className="flex items-center">
                        <span className={`font-semibold ${required ? 'text-black' : 'text-gray-600'}`}>
                            {name}
                            {required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                        <span className={`ml-2 text-sm font-mono ${getTypeColor(node.type)}`}>
                            {node.type}
                        </span>
                        {path !== 'root' && (
                            <div className="ml-2 text-gray-500 text-xs cursor-help group relative">
                                <InformationCircleIcon className="w-4 h-4" />
                                <div className="hidden group-hover:block absolute left-0 bottom-full bg-gray-800 text-white text-xs p-2 rounded w-48 z-10">
                                    JSON path: {path}
                                </div>
                            </div>
                        )}
                    </div>
                    {renderAdditionalDetails()}
                </div>
            </div>
            {renderChildren()}
        </div>
    );
};

export default function GenomeSchemaView() {
    const [showExample, setShowExample] = useState(false);

    const exampleData = {
        genomeName: "hg19",
        chromosomes: [
            { name: "chr1", length: 249250621 },
            { name: "chrX", length: 155270560 }
        ]
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <p className="mb-4 text-gray-700">
                This schema defines the structure for genomic data files. Fields marked with an asterisk (*) are required.
            </p>

            <div className="flex mb-4">
                <Button
                    onClick={() => setShowExample(!showExample)}
                    active
                >
                    {showExample ? 'Hide Example' : 'Show Example'}
                </Button>
            </div>

            {showExample && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Example (minimal valid data):</h2>
                    <pre className="bg-white p-4 rounded overflow-auto text-sm">
                        {JSON.stringify(exampleData, null, 2)}
                    </pre>
                </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <SchemaNode node={genomeDataSchema as any} name="Root" path="root" />
            </div>

            <div className="mt-6 text-sm text-gray-600">
                <h3 className="text-lg font-semibold mb-2">Validation Tips:</h3>
                <ul className="list-disc pl-6">
                    <li className="mb-1">The <code className="bg-gray-100 px-1 py-0.5 rounded">genomeName</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">chromosomes</code>, and <code className="bg-gray-100 px-1 py-0.5 rounded">cytobands</code> fields are required.</li>
                    <li className="mb-1">Chromosome names should follow the pattern <code className="bg-gray-100 px-1 py-0.5 rounded">chr1</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">chr2</code>, etc., with <code className="bg-gray-100 px-1 py-0.5 rounded">chrX</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">chrY</code>, and <code className="bg-gray-100 px-1 py-0.5 rounded">chrM</code> also accepted.</li>
                    <li className="mb-1">For chromosome positions, <code className="bg-gray-100 px-1 py-0.5 rounded">chromEnd</code> must be greater than <code className="bg-gray-100 px-1 py-0.5 rounded">chromStart</code>.</li>
                    <li className="mb-1">The <code className="bg-gray-100 px-1 py-0.5 rounded">gieStain</code> field must be one of the predefined values: gneg, gpos25, gpos50, gpos75, gpos100, acen, gvar, or stalk.</li>
                </ul>
            </div>
        </div>
    );
};
