// @ts-nocheck
import { useState } from "react";
import { genomeFileSchema } from "wuepgg3-track";
import BrowserUrlAnatomy from "./BrowserUrlAnatomy";

type SchemaNode = {
  type?: string | string[];
  required?: string[];
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
  enum?: (string | number)[];
  minimum?: number;
  description?: string;
  patternProperties?: Record<string, SchemaNode>;
  additionalProperties?: boolean | SchemaNode;
  oneOf?: SchemaNode[];
  anyOf?: SchemaNode[];
};

function resolveType(schema: SchemaNode): string {
  if (schema.oneOf || schema.anyOf) return "oneOf";
  const t = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  return t ?? "any";
}

function typeColor(t: string) {
  switch (t) {
    case "string":
      return "text-green-600 dark:text-green-400";
    case "integer":
    case "number":
      return "text-amber-500 dark:text-amber-300";
    case "boolean":
      return "text-violet-500 dark:text-violet-400";
    case "array":
      return "text-sky-500 dark:text-sky-400";
    default:
      return "text-rose-400 dark:text-rose-400";
  }
}

function placeholderValue(schema: SchemaNode): string {
  if (schema.enum) return `"${schema.enum[0]}"`;
  const t = resolveType(schema);
  switch (t) {
    case "string":
      return '"…"';
    case "integer":
    case "number":
      return "0";
    case "boolean":
      return "true";
    default:
      return "null";
  }
}

type NodeProps = {
  schema: SchemaNode;
  keyName?: string;
  isRequired: boolean;
  indent: number;
  isLast: boolean;
};

function SchemaValue({
  schema,
  keyName,
  isRequired,
  indent,
  isLast,
}: NodeProps) {
  const [open, setOpen] = useState(indent < 2);
  const t = resolveType(schema);
  const isObject = t === "object";
  const isArray = t === "array";
  const isComplex = isObject || isArray || t === "oneOf";
  const pad = "  ".repeat(indent);

  const annotation = (
    <span className="ml-3 font-sans text-xs select-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      {isRequired ? (
        <span className="text-red-400 mr-1.5">required</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-600 mr-1.5">
          optional
        </span>
      )}
      <span className={typeColor(t)}>{t}</span>
      {schema.enum && (
        <span className="ml-1 text-gray-400">
          (
          {schema.enum
            .slice(0, 4)
            .map((v) => `"${v}"`)
            .join(" | ")}
          )
        </span>
      )}
      {schema.minimum !== undefined && (
        <span className="ml-1 text-gray-400">≥ {schema.minimum}</span>
      )}
    </span>
  );

  if (!isComplex) {
    return (
      <div className="flex items-baseline group hover:bg-black/[0.03] dark:hover:bg-white/[0.04] rounded px-1">
        <span className="whitespace-pre text-gray-400 select-none">{pad}</span>
        <span className="w-3 shrink-0" />
        {keyName !== undefined && (
          <>
            <span className="text-sky-600 dark:text-sky-300">"{keyName}"</span>
            {isRequired && <span className="text-red-400 select-none">*</span>}
            <span className="text-gray-400">: </span>
          </>
        )}
        <span className={typeColor(t)}>{placeholderValue(schema)}</span>
        {!isLast && <span className="text-gray-400">,</span>}
        {annotation}
      </div>
    );
  }

  if (isObject) {
    const props = schema.properties ?? {};
    const requiredSet = new Set(schema.required ?? []);
    const entries = Object.entries(props).sort(([a], [b]) => {
      const aReq = requiredSet.has(a) ? 0 : 1;
      const bReq = requiredSet.has(b) ? 0 : 1;
      return aReq - bReq;
    });
    return (
      <div>
        <div className="flex items-baseline group hover:bg-black/[0.03] dark:hover:bg-white/[0.04] rounded px-1">
          <span className="whitespace-pre text-gray-400 select-none">
            {pad}
          </span>
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-200 mr-1 w-3 text-xs leading-none shrink-0"
          >
            {open ? "▾" : "▸"}
          </button>
          {keyName !== undefined && (
            <>
              <span className="text-sky-600 dark:text-sky-300">
                "{keyName}"
              </span>
              {isRequired && (
                <span className="text-red-400 select-none">*</span>
              )}
              <span className="text-gray-400">: </span>
            </>
          )}
          {open ? (
            <span className="text-gray-400">{"{"}</span>
          ) : (
            <>
              <span className="text-gray-400 italic text-xs">
                {"{ "}
                {entries
                  .slice(0, 3)
                  .map(([k]) => `"${k}"`)
                  .join(", ")}
                {entries.length > 3 ? ", …" : ""}
                {" }"}
              </span>
              {!isLast && <span className="text-gray-400">,</span>}
            </>
          )}
          {annotation}
        </div>
        {open && (
          <>
            {entries.map(([k, v], i) => (
              <SchemaValue
                key={k}
                schema={v}
                keyName={k}
                isRequired={requiredSet.has(k)}
                indent={indent + 1}
                isLast={i === entries.length - 1}
              />
            ))}
            <div className="flex items-baseline px-1">
              <span className="whitespace-pre text-gray-400 select-none">
                {pad}
              </span>
              <span className="text-gray-400">{"}"}</span>
              {!isLast && <span className="text-gray-400">,</span>}
            </div>
          </>
        )}
      </div>
    );
  }

  if (isArray) {
    const itemSchema = schema.items;
    return (
      <div>
        <div className="flex items-baseline group hover:bg-black/[0.03] dark:hover:bg-white/[0.04] rounded px-1">
          <span className="whitespace-pre text-gray-400 select-none">
            {pad}
          </span>
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-200 mr-1 w-3 text-xs leading-none shrink-0"
          >
            {open ? "▾" : "▸"}
          </button>
          {keyName !== undefined && (
            <>
              <span className="text-sky-600 dark:text-sky-300">
                "{keyName}"
              </span>
              {isRequired && (
                <span className="text-red-400 select-none">*</span>
              )}
              <span className="text-gray-400">: </span>
            </>
          )}
          {open ? (
            <span className="text-gray-400">{"["}</span>
          ) : (
            <>
              <span className="text-gray-400 italic text-xs">{"[ … ]"}</span>
              {!isLast && <span className="text-gray-400">,</span>}
            </>
          )}
          {annotation}
        </div>
        {open && itemSchema && (
          <>
            <SchemaValue
              schema={itemSchema}
              isRequired={false}
              indent={indent + 1}
              isLast={true}
            />
            <div className="flex items-baseline px-1">
              <span className="whitespace-pre text-gray-400 select-none">
                {pad}
              </span>
              <span className="text-gray-400">{"]"}</span>
              {!isLast && <span className="text-gray-400">,</span>}
            </div>
          </>
        )}
      </div>
    );
  }

  // oneOf / anyOf fallback
  return (
    <div className="flex items-baseline group px-1">
      <span className="whitespace-pre text-gray-400 select-none">{pad}</span>
      <span className="w-3 shrink-0" />
      {keyName !== undefined && (
        <>
          <span className="text-sky-600 dark:text-sky-300">"{keyName}"</span>
          {isRequired && <span className="text-red-400 select-none">*</span>}
          <span className="text-gray-400">: </span>
        </>
      )}
      <span className="text-gray-400 italic text-xs">{"…"}</span>
      {!isLast && <span className="text-gray-400">,</span>}
      {annotation}
    </div>
  );
}

function Legend() {
  const items = [
    { label: "key", color: "text-sky-600 dark:text-sky-300" },
    { label: "string", color: "text-green-600 dark:text-green-400" },
    { label: "integer/number", color: "text-amber-500 dark:text-amber-300" },
    { label: "boolean", color: "text-violet-500 dark:text-violet-400" },
    { label: "object/array", color: "text-rose-400 dark:text-rose-400" },
  ];
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono mb-3 px-1 text-gray-500">
      {items.map(({ label, color }) => (
        <span key={label} className={color}>
          {label}
        </span>
      ))}
      <span className="font-sans text-red-400 ml-2">* required</span>
      <span className="font-sans text-gray-400">optional</span>
    </div>
  );
}

const EXAMPLE = [
  {
    name: "hg19",
    id: "hg19_custom",
    chromosomes: [
      { name: "chr1", length: 249250621 },
      { name: "chrX", length: 155270560 },
    ],
    defaultRegion: { chr: "chr1", start: 100000, end: 200000 },
    defaultTracks: [
      {
        type: "ruler",
        name: "Ruler",
      },
    ],
  },
];

export default function GenomeSchemaView() {
  const [showExample, setShowExample] = useState(true);

  return (
    <div className="max-w-8xl mx-auto text-sm">
      <BrowserUrlAnatomy />

      <hr className="my-6 border-gray-200 dark:border-gray-700" />

      <p className="mb-4 text-gray-600 dark:text-gray-300">
        The file must be a JSON array of genome objects (or a single object).
        Hover any line to see its type and whether it is required. Click{" "}
        <span className="font-mono text-xs">▸</span> to collapse sections.
      </p>

      <div className="mb-4">
        <button
          onClick={() => setShowExample((s) => !s)}
          className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {showExample ? "Hide example" : "Show minimal example"}
        </button>
        {showExample && (
          <pre className="mt-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-mono overflow-auto text-gray-800 dark:text-gray-200 leading-5">
            {JSON.stringify(EXAMPLE, null, 2)}
          </pre>
        )}
      </div>

      <Legend />

      <div className="font-mono text-sm leading-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-auto">
        <SchemaValue
          schema={genomeFileSchema as SchemaNode}
          isRequired={true}
          indent={0}
          isLast={true}
        />
      </div>
    </div>
  );
}
