import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareSourceManifest } from "../domain/sourceManifest.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const activeFiles = [
  ["Good", "app/data/good/dwarves.json"], ["Good", "app/data/good/elves.json"],
  ["Good", "app/data/good/hobbits_and_the_shire.json"], ["Good", "app/data/good/men_of_the_west.json"],
  ["Good", "app/data/good/other_good.json"], ["Good", "app/data/good/rohan.json"],
  ["Evil", "app/data/evil/angmar_and_northern_evil.json"],
  ["Evil", "app/data/evil/dol_guldur_and_mirkwood_evil.json"],
  ["Evil", "app/data/evil/gundabad,_moria,_goblins,_and_orcs.json"],
  ["Evil", "app/data/evil/harad,_umbar,_khand,_east.json"],
  ["Evil", "app/data/evil/isengard_and_allies.json"],
  ["Evil", "app/data/evil/mordor_and_sauron-aligned.json"],
  ["Evil", "app/data/evil/shire_invaders.json"],
];
const sources = activeFiles.map(([side, file]) => ({
  side,
  file,
  armies: JSON.parse(fs.readFileSync(path.join(root, file), "utf8")),
}));
const manifestPath = path.join(root, "source-manifest/manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("Missing source-manifest/manifest.json; run npm run extract:source-manifest -- <pdf-directory> first.");
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const mismatches = compareSourceManifest(manifest, sources);
const totals = Object.fromEntries(
  Object.entries(Object.groupBy(mismatches, (item) => item.category)).map(([key, values]) => [key, values.length]),
);
const report = {
  generatedAt: new Date().toISOString(),
  manifestEntries: manifest.entries.length,
  needsReview: manifest.entries.filter((entry) => entry.confidence === "needsReview").map((entry) => ({
    armyName: entry.armyName,
    bookId: entry.bookId,
    pdfPage: entry.pdfPage,
    reasons: entry.reviewReasons,
  })),
  totals,
  mismatches,
};
fs.writeFileSync(path.join(root, "source-manifest/comparison-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Source/catalogue comparison: ${mismatches.length} discrepancies across ${manifest.entries.length} manifest entries`);
for (const [category, count] of Object.entries(totals)) console.log(`  ${category}: ${count}`);
console.log(`Needs human review: ${report.needsReview.length}`);
for (const mismatch of mismatches.slice(0, 10)) {
  console.log(`  [${mismatch.category}] ${mismatch.armyName}${mismatch.profileName ? ` > ${mismatch.profileName}` : ""} (${mismatch.bookId ?? "no source"} p.${mismatch.pdfPage ?? "?"}): ${mismatch.detail}`);
}
