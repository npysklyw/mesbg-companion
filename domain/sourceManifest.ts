import type { CatalogueArmy, CatalogueSource } from "./catalogue.ts";

export type SourceConfidence = "high" | "medium" | "needsReview" | "verified";
export type SourceHeroTier = "legend" | "valour" | "fortitude" | "minor" | "independent";

export type SourceProfile = {
  name: string;
  points: number | null;
  confidence: SourceConfidence;
};

export type SourceHero = SourceProfile & { tier: SourceHeroTier };

export type SourceConstructionRule = {
  code: "MANDATORY_PROFILE" | "MUST_BE_GENERAL";
  profile: string;
  confidence: SourceConfidence;
};

export type SourceManifestEntry = {
  key: string;
  armyName: string;
  bookId: string;
  pdfPage: number;
  printedPage: number | null;
  heroes: SourceHero[];
  warriors: SourceProfile[];
  constructionRules: SourceConstructionRule[];
  confidence: SourceConfidence;
  reviewReasons: string[];
};

export type SourceManifest = {
  schemaVersion: 1;
  generatedAt: string;
  entries: SourceManifestEntry[];
};

const tierHeadings: Array<[RegExp, SourceHeroTier]> = [
  [/HEROES? OF LEGEND/i, "legend"],
  [/HEROES? OF VALOUR/i, "valour"],
  [/HEROES? OF FORTITUDE/i, "fortitude"],
  [/MINOR HEROES?/i, "minor"],
  [/INDEPENDENT HEROES?/i, "independent"],
];

export function normalizeArmyName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[’‘]/g, "'")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^the /, "");
}

function cleanName(value: string): string {
  return value
    .replace(/^[^A-Za-zÀ-ž]+/, "")
    .replace(/\.{2,}.*$/, "")
    .replace(/\s{2,}.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePointsLine(line: string): { name: string; points: number | null } | null {
  if (!/POINTS?/i.test(line)) return null;
  const beforePoints = line.replace(/POINTS?.*$/i, "");
  const numberMatch = beforePoints.match(/(\d{1,3})\s*$/);
  const namePart = numberMatch
    ? beforePoints.slice(0, numberMatch.index)
    : beforePoints.replace(/[?OISL0-9\s.]+$/i, "");
  const name = cleanName(namePart);
  if (!name || /^(banner|war horn|shield|bow|spear|armour|armor|crossbow)/i.test(name)) {
    return null;
  }
  return { name, points: numberMatch ? Number(numberMatch[1]) : null };
}

function candidateArmyName(lines: string[], compositionIndex: number): string {
  for (let index = compositionIndex - 1; index >= 0; index -= 1) {
    const candidate = cleanName(lines[index]);
    if (candidate && !/army composition/i.test(candidate)) return candidate;
  }
  return "Unknown army";
}

export function parseCompositionPage(input: {
  text: string;
  bookId: string;
  pdfPage: number;
}): SourceManifestEntry | null {
  const lines = input.text.split(/\r?\n/);
  const compositionIndex = lines.findIndex((line) => /ARMY COMPOSITION/i.test(line));
  if (compositionIndex < 0) return null;

  const armyName = candidateArmyName(lines, compositionIndex);
  const heroes: SourceHero[] = [];
  const warriors: SourceProfile[] = [];
  const reviewReasons: string[] = [];
  let tier: SourceHeroTier | null = null;
  let inWarriors = false;
  let inAdditionalRules = false;

  for (const line of lines.slice(compositionIndex + 1)) {
    const tierHeading = tierHeadings.find(([pattern]) => pattern.test(line));
    if (tierHeading) {
      tier = tierHeading[1];
      inWarriors = false;
      inAdditionalRules = false;
      continue;
    }
    if (/^\s*WARRIORS?\s*$/i.test(line)) {
      inWarriors = true;
      tier = null;
      inAdditionalRules = false;
      continue;
    }
    if (/ADDITIONAL RULES/i.test(line)) {
      inAdditionalRules = true;
      inWarriors = false;
      tier = null;
      continue;
    }
    if (/SPECIAL RULES/i.test(line)) break;
    if (inAdditionalRules) continue;

    const profile = parsePointsLine(line);
    if (!profile) continue;
    const confidence: SourceConfidence = profile.points === null ? "needsReview" : "high";
    if (profile.points === null) reviewReasons.push(`Unreadable points for ${profile.name}`);
    if (tier) heroes.push({ ...profile, tier, confidence });
    else if (inWarriors) warriors.push({ ...profile, confidence });
  }

  const constructionRules: SourceConstructionRule[] = [];
  const mandatory = input.text.match(/must always contain\s+([^,.]+)[,.]/i);
  if (mandatory) {
    const profile = cleanName(mandatory[1]);
    constructionRules.push({ code: "MANDATORY_PROFILE", profile, confidence: "medium" });
    if (/who is always the Army(?:'|’|s|'s|’s)?\s+General/i.test(input.text)) {
      constructionRules.push({ code: "MUST_BE_GENERAL", profile, confidence: "medium" });
    }
  }

  if (armyName === "Unknown army") reviewReasons.push("Army heading could not be extracted");
  if (heroes.length === 0) reviewReasons.push("No hero rows were extracted");
  if (warriors.length === 0) reviewReasons.push("No warrior rows were extracted");
  const confidence: SourceConfidence = reviewReasons.length > 0 ? "needsReview" : "high";
  return {
    key: `${input.bookId}:${input.pdfPage}`,
    armyName,
    bookId: input.bookId,
    pdfPage: input.pdfPage,
    printedPage: null,
    heroes,
    warriors,
    constructionRules,
    confidence,
    reviewReasons,
  };
}

export function mergeManifestOverrides(
  generated: SourceManifest,
  overrides: readonly SourceManifestEntry[],
): SourceManifest {
  const byKey = new Map(generated.entries.map((entry) => [entry.key, entry]));
  for (const override of overrides) byKey.set(override.key, structuredClone(override));
  return { ...generated, entries: [...byKey.values()] };
}

export type SourceCatalogueMismatch = {
  category: "appArmyMissingFromSource" | "sourceArmyMissingFromApp" | "missingHero" |
    "extraHero" | "missingWarrior" | "extraWarrior" | "pointMismatch" |
    "tierMismatch" | "possibleNameMismatch";
  armyName: string;
  profileName?: string;
  bookId?: string;
  pdfPage?: number;
  confidence?: SourceConfidence;
  detail: string;
};

function levenshtein(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[right.length];
}

export function compareSourceManifest(
  manifest: SourceManifest,
  sources: readonly CatalogueSource[],
): SourceCatalogueMismatch[] {
  const mismatches: SourceCatalogueMismatch[] = [];
  const appArmies = sources.flatMap((source) => source.armies);
  const sourceByName = new Map(manifest.entries.map((entry) => [normalizeArmyName(entry.armyName), entry]));
  const appByName = new Map(appArmies.map((army) => [normalizeArmyName(army.name), army]));

  for (const army of appArmies) {
    const normalized = normalizeArmyName(army.name);
    if (!sourceByName.has(normalized)) {
      const near = manifest.entries.find((entry) => levenshtein(normalized, normalizeArmyName(entry.armyName)) <= 3);
      mismatches.push({
        category: near ? "possibleNameMismatch" : "appArmyMissingFromSource",
        armyName: army.name,
        bookId: near?.bookId,
        pdfPage: near?.pdfPage,
        confidence: near?.confidence,
        detail: near ? `Possible source match: ${near.armyName}` : "No normalized source-manifest match",
      });
    }
  }
  for (const entry of manifest.entries) {
    if (!appByName.has(normalizeArmyName(entry.armyName))) {
      mismatches.push({ category: "sourceArmyMissingFromApp", armyName: entry.armyName, bookId: entry.bookId, pdfPage: entry.pdfPage, confidence: entry.confidence, detail: "No normalized app catalogue match" });
      continue;
    }
    const army = appByName.get(normalizeArmyName(entry.armyName)) as CatalogueArmy;
    compareProfiles(entry, army, "hero", mismatches);
    compareProfiles(entry, army, "warrior", mismatches);
  }
  return mismatches;
}

function compareProfiles(
  entry: SourceManifestEntry,
  army: CatalogueArmy,
  kind: "hero" | "warrior",
  mismatches: SourceCatalogueMismatch[],
) {
  const sourceProfiles = kind === "hero" ? entry.heroes : entry.warriors;
  const appProfiles = kind === "hero" ? army.heroes : army.warbandOptions;
  const sourceMap = new Map(sourceProfiles.map((profile) => [normalizeArmyName(profile.name), profile]));
  const appMap = new Map(appProfiles.map((profile) => [normalizeArmyName(profile.name), profile]));
  const fuzzyMatchedAppNames = new Set<string>();
  for (const profile of sourceProfiles) {
    const appProfile = appMap.get(normalizeArmyName(profile.name));
    if (!appProfile) {
      const near = appProfiles.find(
        (candidate) =>
          levenshtein(normalizeArmyName(profile.name), normalizeArmyName(candidate.name)) <= 3,
      );
      if (near) fuzzyMatchedAppNames.add(normalizeArmyName(near.name));
      mismatches.push({
        category: near ? "possibleNameMismatch" : kind === "hero" ? "missingHero" : "missingWarrior",
        armyName: army.name,
        profileName: profile.name,
        bookId: entry.bookId,
        pdfPage: entry.pdfPage,
        confidence: entry.confidence,
        detail: near ? `Possible app profile match: ${near.name}` : "Listed by source but absent from app",
      });
      continue;
    }
    const appPoints = kind === "hero" ? (appProfile as CatalogueArmy["heroes"][number]).points : (appProfile as CatalogueArmy["warbandOptions"][number]).baseCost;
    if (profile.points !== null && profile.points !== appPoints) {
      mismatches.push({ category: "pointMismatch", armyName: army.name, profileName: profile.name, bookId: entry.bookId, pdfPage: entry.pdfPage, confidence: entry.confidence, detail: `Source ${profile.points}; app ${appPoints}` });
    }
    if (kind === "hero" && (profile as SourceHero).tier !== (appProfile as CatalogueArmy["heroes"][number]).tier) {
      mismatches.push({ category: "tierMismatch", armyName: army.name, profileName: profile.name, bookId: entry.bookId, pdfPage: entry.pdfPage, confidence: entry.confidence, detail: `Source ${(profile as SourceHero).tier}; app ${(appProfile as CatalogueArmy["heroes"][number]).tier}` });
    }
  }
  for (const profile of appProfiles) {
    if (!sourceMap.has(normalizeArmyName(profile.name)) && !fuzzyMatchedAppNames.has(normalizeArmyName(profile.name))) {
      mismatches.push({ category: kind === "hero" ? "extraHero" : "extraWarrior", armyName: army.name, profileName: profile.name, bookId: entry.bookId, pdfPage: entry.pdfPage, confidence: entry.confidence, detail: "Present in app but absent from extracted source entry" });
    }
  }
}
