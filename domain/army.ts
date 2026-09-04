export type HeroTier =
  | "legend"
  | "valour"
  | "fortitude"
  | "minor"
  | "independent";

export type WargearOption = {
  name: string;
  cost: number;
};

export type Warrior = {
  name: string;
  baseCost: number;
  availableWargear: WargearOption[];
  wargearCounts: Record<string, number>;
};

export type Hero = {
  name: string;
  points: number;
  tier: HeroTier;
  legacy?: boolean;
  mustBeLeader?: boolean;
  wargear: WargearOption[];
  wargearChecks: Record<string, boolean>;
  selected: boolean;
  warband: Warrior[];
};

export type Army = {
  name: string;
  faction: string;
  heroes: Hero[];
  warbandOptions?: Warrior[];
};

export type ArmyTotals = {
  points: number;
  modelCount: number;
  bowCount: number;
  breakValue: number;
  bowAllowance: number;
};

const TIER_CAPACITIES: Record<HeroTier, number> = {
  legend: 18,
  valour: 15,
  fortitude: 12,
  minor: 6,
  independent: 0,
};

export function calculateTierCapacity(tier: HeroTier): number {
  return TIER_CAPACITIES[tier];
}

export function calculateWarbandModelCount(warband: Warrior[]): number {
  return warband.reduce(
    (total, warrior) =>
      total +
      Object.values(warrior.wargearCounts ?? {}).reduce(
        (warriorTotal, count) => warriorTotal + count,
        0,
      ),
    0,
  );
}

export function calculateHeroWargearPoints(hero: Hero): number {
  return hero.wargear.reduce(
    (total, option) =>
      total + (hero.wargearChecks[option.name] ? option.cost || 0 : 0),
    0,
  );
}

export function calculateWarriorPoints(warrior: Warrior): number {
  return Object.entries(warrior.wargearCounts ?? {}).reduce(
    (total, [selection, count]) => {
      if (selection === "Base") {
        return total + (warrior.baseCost || 0) * count;
      }

      const wargear = warrior.availableWargear.find(
        (option) => option.name === selection,
      );
      return wargear
        ? total + ((warrior.baseCost || 0) + (wargear.cost || 0)) * count
        : total;
    },
    0,
  );
}

export function calculateWarbandPoints(hero: Hero): number {
  return (
    hero.points +
    calculateHeroWargearPoints(hero) +
    hero.warband.reduce(
      (total, warrior) => total + calculateWarriorPoints(warrior),
      0,
    )
  );
}

export function calculateBowCount(army: Army | null): number {
  if (!army) return 0;

  return army.heroes.reduce((armyTotal, hero) => {
    if (!hero.selected) return armyTotal;
    return (
      armyTotal +
      hero.warband.reduce(
        (warbandTotal, warrior) =>
          warbandTotal +
          Object.entries(warrior.wargearCounts ?? {}).reduce(
            (warriorTotal, [selection, count]) =>
              selection.toLowerCase().includes("bow")
                ? warriorTotal + count
                : warriorTotal,
            0,
          ),
        0,
      )
    );
  }, 0);
}

export function calculateModelCount(
  army: Army | null,
  includeLegacyProfiles = true,
): number {
  if (!army) return 0;

  return army.heroes.reduce((total, hero) => {
    if (!includeLegacyProfiles && hero.legacy) return total;
    return hero.selected
      ? total + 1 + calculateWarbandModelCount(hero.warband)
      : total;
  }, 0);
}

export function calculateTotalPoints(
  army: Army | null,
  includeLegacyProfiles = true,
): number {
  if (!army) return 0;

  return army.heroes.reduce((total, hero) => {
    if (!includeLegacyProfiles && hero.legacy) return total;
    return hero.selected ? total + calculateWarbandPoints(hero) : total;
  }, 0);
}

export function calculateBreakValue(modelCount: number): number {
  return modelCount === 0 ? 0 : Math.floor(modelCount / 2) + 1;
}

export function calculateBowAllowance(modelCount: number): number {
  return modelCount === 0 ? 0 : Math.floor(modelCount / 3);
}

export function calculateArmyTotals(
  army: Army | null,
  includeLegacyProfiles = true,
): ArmyTotals {
  const modelCount = calculateModelCount(army, includeLegacyProfiles);
  return {
    points: calculateTotalPoints(army, includeLegacyProfiles),
    modelCount,
    bowCount: calculateBowCount(army),
    breakValue: calculateBreakValue(modelCount),
    bowAllowance: calculateBowAllowance(modelCount),
  };
}
