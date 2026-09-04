export type CatalogueSide = "Good" | "Evil";

export type CatalogueWargear = {
  name: string;
  cost: number;
};

export type CatalogueWarrior = {
  name: string;
  baseCost: number;
  legacy?: boolean;
  availableWargear: CatalogueWargear[];
};

export type CatalogueHero = {
  name: string;
  points: number;
  tier: "legend" | "valour" | "fortitude" | "independent";
  legacy?: boolean;
  mustBeLeader?: boolean;
  mandatory?: boolean;
  mustBeGeneral?: boolean;
  wargear: CatalogueWargear[];
  wounds: number;
  might: number;
  will: number;
  fate: number;
};

export type CatalogueArmy = {
  name: string;
  faction: string;
  heroes: CatalogueHero[];
  warbandOptions: CatalogueWarrior[];
};

export type CatalogueSource = {
  side: CatalogueSide;
  file: string;
  armies: CatalogueArmy[];
};

export function resolveCatalogueArmy(
  catalogues: readonly CatalogueArmy[][],
  armyName: string,
): CatalogueArmy | undefined {
  return catalogues.flat().find((army) => army.name === armyName);
}

export function getSelectableCatalogueHeroes(
  army: CatalogueArmy,
  legacyProfilesEnabled: boolean,
): CatalogueHero[] {
  return legacyProfilesEnabled
    ? [...army.heroes]
    : army.heroes.filter((hero) => !hero.legacy);
}

export function getInitialCatalogueHeroRequirements(hero: CatalogueHero) {
  return {
    mandatory: hero.mandatory ?? false,
    mustBeGeneral: hero.mustBeGeneral ?? false,
    isGeneral: hero.mustBeGeneral ?? false,
    mustBeLeader: hero.mustBeLeader ?? hero.mandatory ?? false,
    selected: hero.mandatory ?? false,
  };
}

export type WarriorFilterReason = "legacy-disabled" | "zero-cost-profile";

export function getWarriorFilterReason(
  warrior: CatalogueWarrior,
  legacyProfilesEnabled: boolean,
): WarriorFilterReason | undefined {
  if ((warrior.baseCost || 0) <= 0) return "zero-cost-profile";
  if (!legacyProfilesEnabled && warrior.legacy) return "legacy-disabled";
  return undefined;
}

export function getSelectableCatalogueWarriors(
  army: CatalogueArmy,
  legacyProfilesEnabled: boolean,
): CatalogueWarrior[] {
  return army.warbandOptions.filter(
    (warrior) => !getWarriorFilterReason(warrior, legacyProfilesEnabled),
  );
}

export type CatalogueReachabilityIssue = {
  code: string;
  message: string;
  side?: CatalogueSide;
  army?: string;
  profile?: string;
};

export type CatalogueReachabilityResult = {
  counts: {
    goodArmies: number;
    evilArmies: number;
    heroes: number;
    warriors: number;
    failures: number;
  };
  errors: CatalogueReachabilityIssue[];
  warnings: CatalogueReachabilityIssue[];
};

export function auditCatalogueReachability(
  sources: readonly CatalogueSource[],
): CatalogueReachabilityResult {
  const errors: CatalogueReachabilityIssue[] = [];
  const warnings: CatalogueReachabilityIssue[] = [];
  const catalogues = sources.map((source) => source.armies);
  const allArmies = sources.flatMap((source) =>
    source.armies.map((army) => ({ source, army })),
  );

  for (const { source, army } of allArmies) {
    const context = { side: source.side, army: army.name };
    const matchingArmies = allArmies.filter(
      (candidate) => candidate.army.name === army.name,
    );
    const resolved = resolveCatalogueArmy(catalogues, army.name);
    if (!resolved || matchingArmies.length !== 1) {
      errors.push({
        code: "ARMY_UNRESOLVABLE",
        message: `${army.name} resolves to ${matchingArmies.length} catalogue records`,
        ...context,
      });
    }

    const selectableHeroes = getSelectableCatalogueHeroes(army, false);
    const leaders = selectableHeroes.filter(
      (hero) => hero.tier !== "independent",
    );
    if (selectableHeroes.length === 0) {
      warnings.push({
        code: "NO_SELECTABLE_HEROES",
        message: `${army.name} has no non-legacy selectable heroes`,
        ...context,
      });
    }
    if (selectableHeroes.length > 0 && leaders.length === 0) {
      warnings.push({
        code: "INDEPENDENT_HERO_ONLY",
        message: `${army.name} contains only Independent Heroes; no warband is expected`,
        ...context,
      });
    }
    if (army.heroes.length === 0) {
      warnings.push({
        code: "EMPTY_HERO_COLLECTION",
        message: `${army.name} has an empty hero collection and needs human review`,
        ...context,
      });
    }
    if (army.warbandOptions.length === 0) {
      warnings.push({
        code: "EMPTY_WARRIOR_COLLECTION",
        message: `${army.name} has no warrior records; this may be a hero-only army`,
        ...context,
      });
    }

    for (const hero of army.heroes) {
      if (hero.mandatory && !selectableHeroes.includes(hero)) {
        errors.push({
          code: "MANDATORY_PROFILE_UNREACHABLE",
          message: `${hero.name} is mandatory but excluded by builder filtering`,
          profile: hero.name,
          ...context,
        });
      }
    }

    for (const warrior of army.warbandOptions) {
      const reason = getWarriorFilterReason(warrior, false);
      if (reason) {
        warnings.push({
          code:
            reason === "zero-cost-profile"
              ? warrior.name.toLowerCase().includes("crew")
                ? "ZERO_COST_CREW_FILTERED"
                : "ZERO_COST_PROFILE_FILTERED"
              : "LEGACY_PROFILE_FILTERED",
          message: `${warrior.name} is excluded by the builder (${reason})`,
          profile: warrior.name,
          ...context,
        });
      } else if (leaders.length === 0) {
        warnings.push({
          code: "WARRIOR_WITHOUT_LEADER",
          message: `${warrior.name} has no selectable non-Independent Hero to lead it`,
          profile: warrior.name,
          ...context,
        });
      }
    }
  }

  return {
    counts: {
      goodArmies: allArmies.filter(({ source }) => source.side === "Good").length,
      evilArmies: allArmies.filter(({ source }) => source.side === "Evil").length,
      heroes: allArmies.reduce((total, { army }) => total + army.heroes.length, 0),
      warriors: allArmies.reduce(
        (total, { army }) => total + army.warbandOptions.length,
        0,
      ),
      failures: errors.length,
    },
    errors,
    warnings,
  };
}
