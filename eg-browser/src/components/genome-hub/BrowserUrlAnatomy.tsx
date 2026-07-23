// Compact, slide-friendly breakdown of the browser URL parameters.
// Edit the SPECIMENS / DEFS data below to change what's shown.

type Kind =
  | "base"
  | "genome"
  | "position"
  | "hub"
  | "bundle"
  | "session"
  | "punc";

// Full literal class strings so Tailwind keeps them in the build.
const KIND: Record<Exclude<Kind, "punc">, { seg: string; border: string; dot: string }> = {
  base: {
    seg: "text-slate-700 bg-slate-500/10",
    border: "border-slate-400/60",
    dot: "bg-slate-500",
  },
  genome: {
    seg: "text-green-700 bg-green-500/10",
    border: "border-green-600/60",
    dot: "bg-green-600",
  },
  position: {
    seg: "text-sky-700 bg-sky-500/10",
    border: "border-sky-600/60",
    dot: "bg-sky-600",
  },
  hub: {
    seg: "text-amber-700 bg-amber-500/10",
    border: "border-amber-600/60",
    dot: "bg-amber-600",
  },
  bundle: {
    seg: "text-violet-700 bg-violet-500/10",
    border: "border-violet-600/60",
    dot: "bg-violet-600",
  },
  session: {
    seg: "text-rose-700 bg-rose-500/10",
    border: "border-rose-600/60",
    dot: "bg-rose-600",
  },
};

type Token = { text: string; kind: Kind };
type Def = { kind: Exclude<Kind, "punc" | "base">; key: string; desc: string };

const BASE = "https://epigenomegateway.wustl.edu/browser/";

const SPECIMENS: { title: string; tokens: Token[]; defs: Def[] }[] = [
  {
    title: "Genome + view + hub",
    tokens: [
      { text: BASE, kind: "base" },
      { text: "?", kind: "punc" },
      { text: "genome=", kind: "genome" },
      { text: "hg19", kind: "genome" },
      { text: "&", kind: "punc" },
      { text: "position=", kind: "position" },
      { text: "chr7:27170000-27200000", kind: "position" },
      { text: "&", kind: "punc" },
      { text: "hub=", kind: "hub" },
      { text: "https://vizhub.wustl.edu/hg19/hubsample.json", kind: "hub" },
    ],
    defs: [
      { kind: "genome", key: "genome", desc: "assembly to open" },
      { kind: "position", key: "position", desc: "starting view region" },
      { kind: "hub", key: "hub", desc: "data hub JSON → tracks" },
    ],
  },
  {
    title: "Saved bundle",
    tokens: [
      { text: BASE, kind: "base" },
      { text: "?", kind: "punc" },
      { text: "bundle=", kind: "bundle" },
      { text: "1692c5f0-c392-11e9-829c-912864922e1e", kind: "bundle" },
    ],
    defs: [{ kind: "bundle", key: "bundle", desc: "saved session, by UUID" }],
  },
  {
    title: "Session file",
    tokens: [
      { text: BASE, kind: "base" },
      { text: "?", kind: "punc" },
      { text: "sessionFile=", kind: "session" },
      { text: "…/eg-session--….json", kind: "session" },
    ],
    defs: [{ kind: "session", key: "sessionFile", desc: "session JSON to load" }],
  },
];

function Url({ tokens }: { tokens: Token[] }) {
  return (
    <div className="font-mono text-[13px] leading-7 whitespace-nowrap overflow-x-auto pb-1">
      {tokens.map((t, i) => {
        if (t.kind === "punc") {
          return (
            <span key={i} className="text-gray-700 font-extrabold px-0.5">
              {t.text}
            </span>
          );
        }
        const c = KIND[t.kind];
        return (
          <span
            key={i}
            className={`rounded-sm px-1 font-semibold border-b-2 ${c.seg} ${c.border}`}
          >
            {t.text}
          </span>
        );
      })}
    </div>
  );
}

export default function BrowserUrlAnatomy() {
  return (
    <div className="mx-auto max-w-none text-gray-900">
      {/* header */}
      <div className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-green-700">
          Epigenome Gateway
        </p>
        <h2 className="mt-1 font-mono text-2xl font-bold tracking-tight text-gray-900">
          Anatomy of a browser URL
        </h2>
      </div>

      {/* anatomy key */}
      <div className="mb-5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-gray-700">
        <span>
          <b className="text-gray-900">?</b> starts params
        </span>
        <span>
          <b className="text-gray-900">key=value</b> one setting
        </span>
        <span>
          <b className="text-gray-900">&amp;</b> joins the next
        </span>
      </div>

      {/* specimens */}
      <div className="space-y-4">
        {SPECIMENS.map((s) => (
          <div
            key={s.title}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-2 font-mono text-xs font-semibold text-gray-700">
              {s.title}
            </div>
            <Url tokens={s.tokens} />
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
              {s.defs.map((d) => {
                const c = KIND[d.kind];
                return (
                  <span key={d.key} className="inline-flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                    <span className="font-mono font-semibold text-gray-900">
                      {d.key}
                    </span>
                    <span className="text-gray-500">—</span>
                    <span className="text-gray-700">{d.desc}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
