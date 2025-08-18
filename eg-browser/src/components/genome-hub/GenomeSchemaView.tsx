import { useState, useRef, CSSProperties, useEffect } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { genomeDataSchema } from "wuepgg3-track";
import Button from "../ui/button/Button";
import { generateUUID } from "wuepgg3-track";
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
  onExpand?: () => void;
}> = ({ node, name, path, required = false, depth = 0, onExpand }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({
    position: "absolute",
    visibility: "hidden",
  });
  const iconContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const hasChildren =
    (node.properties && Object.keys(node.properties).length > 0) ||
    node.items ||
    (node.patternProperties && Object.keys(node.patternProperties).length > 0);

  const toggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (newExpanded && onExpand) {
      onExpand();
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "string":
        return "text-green-600 dark:text-green-400";
      case "integer":
      case "number":
        return "text-blue-600 dark:text-blue-400";
      case "boolean":
        return "text-purple-600 dark:text-purple-400";
      case "array":
        return "text-yellow-600 dark:text-yellow-400";
      case "object":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const renderAdditionalDetails = () => {
    const details = [];

    if (node.enum) {
      details.push(
        <div
          key="enum"
          className="ml-4 text-sm text-gray-600 dark:text-gray-400"
        >
          Allowed values: [{node.enum.map((v) => `"${v}"`).join(", ")}]
        </div>
      );
    }

    if (node.minimum !== undefined) {
      details.push(
        <div
          key="min"
          className="ml-4 text-sm text-gray-600 dark:text-gray-400"
        >
          Minimum: {node.minimum}
        </div>
      );
    }

    if (node.additionalProperties === false) {
      details.push(
        <div
          key="additionalProps"
          className="ml-4 text-sm text-gray-600 dark:text-gray-400"
        >
          No additional properties allowed
        </div>
      );
    }

    return details;
  };

  const renderChildren = () => {
    if (!isExpanded) return null;

    const children = [];

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
            onExpand={onExpand}
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
            onExpand={onExpand}
          />
        </div>
      );
    }

    if (node.patternProperties) {
      Object.entries(node.patternProperties).forEach(([pattern, schema]) => {
        children.push(
          <div key={`${path}.pattern.${pattern}`} className="ml-8 mt-2">
            <div className="font-medium">
              Pattern:{" "}
              <span className="font-mono text-orange-600">{pattern}</span>
            </div>
            <SchemaNode
              node={schema}
              name="patternProperty"
              path={`${path}.pattern.${pattern}`}
              depth={depth + 1}
              onExpand={onExpand}
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
              onExpand={onExpand}
            />
          ))}
        </div>
      );
    }

    return children.length > 0 ? <div className="ml-8">{children}</div> : null;
  };

  useEffect(() => {
    if (isTooltipVisible && iconContainerRef.current && tooltipRef.current) {
      const scrollContainer = iconContainerRef.current.closest<HTMLElement>(
        '[data-scroll-container="true"]'
      );
      if (!scrollContainer) return;

      const iconRect = iconContainerRef.current.getBoundingClientRect();
      const scrollRect = scrollContainer.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      const spaceBelow = scrollRect.bottom - iconRect.bottom;
      const spaceAbove = iconRect.top - scrollRect.top;

      let top = iconRect.height + 4;
      let left = (iconRect.width - tooltipRect.width) / 2;

      if (
        spaceBelow < tooltipRect.height + 4 &&
        spaceAbove > tooltipRect.height + 4
      ) {
        top = -(tooltipRect.height + 4);
      } else if (
        spaceBelow < tooltipRect.height + 4 &&
        spaceAbove < tooltipRect.height + 4
      ) {
        if (spaceAbove > spaceBelow) {
          top = -(tooltipRect.height + 4);
          if (iconRect.top + top < scrollRect.top) {
            top = scrollRect.top - iconRect.top;
          }
        } else {
          if (iconRect.bottom + top + tooltipRect.height > scrollRect.bottom) {
            top = scrollRect.bottom - iconRect.bottom - tooltipRect.height;
          }
        }
      }

      const desiredLeftEdge = iconRect.left + left;
      const desiredRightEdge = desiredLeftEdge + tooltipRect.width;

      if (desiredRightEdge > scrollRect.right) {
        left -= desiredRightEdge - scrollRect.right + 4;
      }
      if (desiredLeftEdge < scrollRect.left) {
        left += scrollRect.left - desiredLeftEdge + 4;
      }

      setTooltipStyle((prevStyle) => ({
        ...prevStyle,
        top: `${top}px`,
        left: `${left}px`,
        visibility: "visible",
      }));
    }
  }, [isTooltipVisible]);

  const handleMouseEnter = () => {
    setIsTooltipVisible(true);
  };

  const handleMouseLeave = () => {
    setIsTooltipVisible(false);
    setTooltipStyle({
      position: "absolute",
      visibility: "hidden",
    });
  };

  return (
    <div className={`mt-1 ${depth > 0 ? "ml-4" : ""}`}>
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
            <span
              className={`font-semibold ${required
                ? "text-black dark:text-white"
                : "text-gray-600 dark:text-gray-400"
                }`}
            >
              {name}
              {required && <span className="text-red-500 ml-1">*</span>}
            </span>
            <span
              className={`ml-2 text-sm font-mono ${getTypeColor(node.type)}`}
            >
              {node.type}
            </span>
            {path !== "root" && (
              <div
                ref={iconContainerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="ml-2 text-gray-500 text-xs cursor-help relative"
              >
                <InformationCircleIcon className="w-4 h-4" />
                <div
                  ref={tooltipRef}
                  style={tooltipStyle}
                  className="bg-gray-800 text-white text-xs p-2 rounded w-48 z-10 pointer-events-none"
                >
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
  const containerRef = useRef<HTMLDivElement>(null);

  const exampleData = {
    name: "hg19",
    id: generateUUID(),
    chromosomes: [
      { name: "chr1", length: 249250621 },
      { name: "chrX", length: 155270560 },
    ],
  };

  const handleNodeExpand = () => {
    if (containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollTo({
          left: containerRef.current.scrollWidth,
          behavior: "smooth",
        });
      }, 100);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <p className="mb-4">
        This schema defines the structure for genomic data files. Fields marked
        with an asterisk (*) are required.
      </p>

      <div className="flex mb-4">
        <Button onClick={() => setShowExample(!showExample)} active>
          {showExample ? "Hide Example" : "Show Example"}
        </Button>
      </div>

      {showExample && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-background rounded-lg">
          <h2 className="text-lg font-semibold mb-2">
            Example (minimal valid data):
          </h2>
          <pre className="bg-white dark:bg-dark-background p-4 rounded overflow-auto text-sm">
            {JSON.stringify(exampleData, null, 2)}
          </pre>
        </div>
      )}

      <div
        ref={containerRef}
        data-scroll-container="true"
        className="bg-gray-50 dark:bg-dark-background border border-gray-200 dark:border-dark-secondary rounded-lg p-4 break-words overflow-x-auto"
      >
        <SchemaNode
          node={genomeDataSchema as any}
          name="Root"
          path="root"
          onExpand={handleNodeExpand}
        />
      </div>

      <div className="mt-6 text-sm text-gray-400">
        <h3 className="text-lg font-semibold mb-2">Validation Tips:</h3>
        <ul className="list-disc pl-6">
          <li className="mb-1">
            The{" "}
            <code className="bg-gray-50 px-1 py-0.5 rounded">genomeName</code>,{" "}
            <code className="bg-gray-50 px-1 py-0.5 rounded">chromosomes</code>,
            and{" "}
            <code className="bg-gray-50 px-1 py-0.5 rounded">cytobands</code>{" "}
            fields are required.
          </li>
          <li className="mb-1">
            Chromosome names should follow the pattern{" "}
            <code className="bg-gray-50 px-1 py-0.5 rounded">chr1</code>,{" "}
            <code className="bg-gray-50 px-1 py-0.5 rounded">chr2</code>, etc.,
            with <code className="bg-gray-50 px-1 py-0.5 rounded">chrX</code>,{" "}
            <code className="bg-gray-50 px-1 py-0.5 rounded">chrY</code>, and{" "}
            <code className="bg-gray-50 px-1 py-0.5 rounded">chrM</code> also
            accepted.
          </li>
          <li className="mb-1">
            For chromosome positions,{" "}
            <code className="bg-gray-50 px-1 py-0.5 rounded">chromEnd</code>{" "}
            must be greater than{" "}
            <code className="bg-gray-50 px-1 py-0.5 rounded">chromStart</code>.
          </li>
          <li className="mb-1">
            The <code className="bg-gray-50 px-1 py-0.5 rounded">gieStain</code>{" "}
            field must be one of the predefined values: gneg, gpos25, gpos50,
            gpos75, gpos100, acen, gvar, or stalk.
          </li>
        </ul>
      </div>
    </div>
  );
}
