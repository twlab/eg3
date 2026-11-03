/* ══════════════════════════════════════════════════════════════════════════
   What a nested mark's label says: rule D (PLAN-nested.md in
   eg3/claude-memory). An insertion with one version among the haplotypes
   counted keeps the plain "+6". With two or more, the label spells the
   row's version and marks what differs from the commonest version, the
   longest form first, for BarCanvas to draw the first that fits the room
   before the next mark:

     one version (plain)                 +6
     nested, the commonest, up to 24 bp  +6 TTTTGT  ·  +6
     nested, another, up to 24 bp        +6 TTT[C]GT  ·  +6 ◆1  ·  +6
     nested, the commonest, longer       +112
     nested, another, longer, 1-2 changes  +112 …CCA[G]TGA…  ·  +112 ◆1  ·  +112
     nested, another, longer, more         +112 ◆3  ·  +112

   [x] is a chip: a black box with the row's base in white, as the bar
   draws a changed base. [−n] a deletion inside the insertion; in an
   excerpt a change longer than three bases is [+n] or [≠n]. The forms are
   made as text, the same text the test predictor makes
   (testing/tools/nestedRule.ts), then cut into runs for the canvas.
   ══════════════════════════════════════════════════════════════════════════ */

/** Spelled whole up to this many bases. */
export const SPELL_MAX = 24;
/** Bases shown either side of a change in an excerpt. */
export const EXCERPT = 3;
/** Changes an excerpt can show; more, and the label counts them. */
export const EXCERPT_MAX = 2;

/** One difference between a row's version and the commonest: offsets
    `at` into the row's version, `comAt` into the commonest's. */
export interface InnerDiff {
  kind: "substitution" | "insertion" | "deletion" | "replacement";
  at: number;
  /** The row's bases it covers; 0 for a deletion. */
  len: number;
  /** The commonest version's bases it stands for. */
  gone: number;
  comAt: number;
}

/** A run of a label: text, or a chip with the text in white on black. */
export interface LabelRun {
  text: string;
  chip?: boolean;
}

/** The label's prefix: the surplus at an insertion site, "+6"; elsewhere
    the version's bases for the reference's between the anchors, "33 for
    20" (PLAN-bubble-sites.md). */
export const labelPrefix = (bases: number, refLen: number) =>
  refLen === 0 ? `+${bases.toLocaleString("en-US")}` : `${bases.toLocaleString("en-US")} for ${refLen.toLocaleString("en-US")}`;

/** The label's forms as text, longest first. */
export function labelForms(seq: string, diffs: InnerDiff[], nested: boolean, prefix = `+${seq.length.toLocaleString("en-US")}`): string[] {
  const size = prefix;
  if (!nested || !seq.length) return [size];
  if (!diffs.length) return seq.length <= SPELL_MAX ? [`${size} ${seq}`, size] : [size];
  const count = `${size} ◆${diffs.length}`;
  const chipped = (i: number) => diffs.some((d) => d.kind !== "deletion" && i >= d.at && i < d.at + d.len);
  if (seq.length <= SPELL_MAX) {
    /* Chipped bases run together in one chip; a deletion is a chip of its own. */
    let out = "";
    let open = false;
    for (let i = 0; i <= seq.length; i++) {
      for (const d of diffs) {
        if (d.kind !== "deletion" || d.at !== i) continue;
        if (open) out += "]";
        open = false;
        out += `[−${d.gone}]`;
      }
      if (i === seq.length) break;
      const chip = chipped(i);
      if (chip && !open) out += "[";
      if (!chip && open) out += "]";
      open = chip;
      out += seq[i];
    }
    if (open) out += "]";
    return [`${size} ${out}`, count, size];
  }
  if (diffs.length > EXCERPT_MAX) return [count, size];
  const pieces: string[] = [];
  let shown = 0;
  for (const d of diffs) {
    const from = Math.max(shown, d.at - EXCERPT);
    const to = Math.min(seq.length, d.at + d.len + EXCERPT);
    const core =
      d.kind === "deletion"
        ? `[−${d.gone}]`
        : d.len <= EXCERPT
          ? `[${seq.slice(d.at, d.at + d.len)}]`
          : `[${d.kind === "insertion" ? "+" : "≠"}${d.len}]`;
    pieces.push(`${from > shown || (shown === 0 && from > 0) ? "…" : ""}${seq.slice(from, d.at)}${core}${seq.slice(d.at + d.len, to)}`);
    shown = to;
  }
  return [`${size} ${pieces.join("")}${shown < seq.length ? "…" : ""}`, count, size];
}

/** A form cut into runs: what is in brackets is a chip. */
export function runsOf(form: string): LabelRun[] {
  const runs: LabelRun[] = [];
  const re = /\[([^\]]*)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(form))) {
    if (m.index > last) runs.push({ text: form.slice(last, m.index) });
    runs.push({ text: m[1], chip: true });
    last = m.index + m[0].length;
  }
  if (last < form.length) runs.push({ text: form.slice(last) });
  return runs;
}

/** Runs back as text, chips in brackets: what the test reads. */
export function formText(runs: LabelRun[]): string {
  return runs.map((run) => (run.chip ? `[${run.text}]` : run.text)).join("");
}
