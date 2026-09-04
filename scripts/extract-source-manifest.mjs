import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeManifestOverrides, parseCompositionPage } from "../domain/sourceManifest.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pdfDirectory = path.resolve(process.argv[2] ?? root);
const outputDirectory = path.join(root, "source-manifest");
const books = [
  { id: "lotr-2024", pattern: /Lord.of.the.Rings.2024/i },
  { id: "hobbit-2024", pattern: /Hobbit.2024/i },
  { id: "middle-earth", pattern: /Armies.?of.?Middle.?Earth/i },
];

function pythonCandidates() {
  const configured = process.env.SOURCE_MANIFEST_PYTHON;
  const bundled = path.join(
    os.homedir(),
    ".cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe",
  );
  return [configured, bundled, "python3", "python"].filter(Boolean);
}

function extractPages(pdfPath) {
  const helper = path.join(root, "scripts/extract-pdf-pages.py");
  const failures = [];
  for (const executable of pythonCandidates()) {
    const result = spawnSync(executable, [helper, pdfPath], {
      encoding: "utf8",
      maxBuffer: 300 * 1024 * 1024,
      windowsHide: true,
    });
    if (result.status === 0) return JSON.parse(result.stdout);
    failures.push(`${executable}: ${(result.stderr || result.error?.message || "failed").trim()}`);
  }
  throw new Error(`No Python+pypdf extractor succeeded. Set SOURCE_MANIFEST_PYTHON.\n${failures.join("\n")}`);
}

const pdfNames = fs.readdirSync(pdfDirectory).filter((name) => name.toLowerCase().endsWith(".pdf"));
const entries = [];
const bookSummaries = [];
for (const book of books) {
  const filename = pdfNames.find((name) => book.pattern.test(name));
  if (!filename) {
    bookSummaries.push({ bookId: book.id, filename: null, candidatePages: 0, status: "missing" });
    continue;
  }
  const pages = extractPages(path.join(pdfDirectory, filename));
  let candidatePages = 0;
  pages.forEach((text, index) => {
    if (!/ARMY COMPOSITION/i.test(text)) return;
    if (!/(HEROES? OF (LEGEND|VALOUR|FORTITUDE)|MINOR HEROES?|INDEPENDENT HEROES?|WARRIORS?)/i.test(text)) return;
    candidatePages += 1;
    const parsed = parseCompositionPage({ text, bookId: book.id, pdfPage: index + 1 });
    if (parsed) entries.push(parsed);
  });
  bookSummaries.push({ bookId: book.id, filename, candidatePages, status: "extracted" });
}

fs.mkdirSync(outputDirectory, { recursive: true });
const generated = { schemaVersion: 1, generatedAt: new Date().toISOString(), entries };
const overridePath = path.join(outputDirectory, "overrides.json");
const overrides = fs.existsSync(overridePath)
  ? JSON.parse(fs.readFileSync(overridePath, "utf8")).entries ?? []
  : [];
const manifest = mergeManifestOverrides(generated, overrides);
fs.writeFileSync(path.join(outputDirectory, "generated.json"), `${JSON.stringify(generated, null, 2)}\n`);
fs.writeFileSync(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(
  path.join(outputDirectory, "extraction-summary.json"),
  `${JSON.stringify({ generatedAt: generated.generatedAt, books: bookSummaries }, null, 2)}\n`,
);

console.log(`Source manifest: ${manifest.entries.length} entries (${overrides.length} manual overrides)`);
for (const summary of bookSummaries) {
  console.log(`${summary.bookId}: ${summary.candidatePages} candidate composition pages (${summary.status})`);
}
console.log(
  `Confidence: ${manifest.entries.filter((entry) => ["high", "verified"].includes(entry.confidence)).length} high/verified, ${manifest.entries.filter((entry) => entry.confidence === "needsReview").length} needsReview`,
);
