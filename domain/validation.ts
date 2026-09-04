import type { Army, Hero } from "./army.ts";
import {
  calculateBowAllowance,
  calculateBowCount,
  calculateModelCount,
  calculateTierCapacity,
  calculateWarbandModelCount,
} from "./army.ts";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssueCode =
  | "WARBAND_CAPACITY_EXCEEDED"
  | "INDEPENDENT_HERO_DUPLICATED"
  | "INDEPENDENT_HERO_LEADING_WARBAND"
  | "MANDATORY_LEADER_CANNOT_BE_REMOVED"
  | "MANDATORY_HERO_REQUIRED"
  | "REQUIRED_GENERAL_MISSING"
  | "BOW_LIMIT_EXCEEDED";

export type ValidationIssue = {
  code: ValidationIssueCode;
  severity: ValidationSeverity;
  message: string;
  heroName?: string;
  heroIndex?: number;
  warbandIndex?: number;
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

function capacityIssue(hero: Hero, heroIndex?: number): ValidationIssue {
  const capacity = calculateTierCapacity(hero.tier);
  return {
    code: "WARBAND_CAPACITY_EXCEEDED",
    severity: "error",
    message: `${hero.name}'s warband exceeds its capacity of ${capacity}.`,
    heroName: hero.name,
    heroIndex,
  };
}

export function isWarbandAtCapacity(hero: Hero): boolean {
  return (
    calculateWarbandModelCount(hero.warband) >=
    calculateTierCapacity(hero.tier)
  );
}

export function getHeroSelectionIssue(
  army: Army,
  hero: Hero,
): ValidationIssue | null {
  if (hero.selected && (hero.mandatory || hero.mustBeLeader)) {
    return {
      code: "MANDATORY_LEADER_CANNOT_BE_REMOVED",
      severity: "error",
      message: "Leader Required",
      heroName: hero.name,
      heroIndex: army.heroes.indexOf(hero),
    };
  }

  if (
    !hero.selected &&
    hero.tier === "independent" &&
    army.heroes.some(
      (candidate) =>
        candidate !== hero &&
        candidate.selected &&
        candidate.tier === "independent" &&
        candidate.name === hero.name,
    )
  ) {
    return {
      code: "INDEPENDENT_HERO_DUPLICATED",
      severity: "error",
      message: `${hero.name} is already selected.`,
      heroName: hero.name,
      heroIndex: army.heroes.indexOf(hero),
    };
  }

  return null;
}

export function getWarriorAdditionIssue(
  army: Army,
  hero: Hero,
  selection: string,
): ValidationIssue | null {
  if (isWarbandAtCapacity(hero)) {
    return capacityIssue(hero, army.heroes.indexOf(hero));
  }

  if (selection.toLowerCase().includes("bow")) {
    const bowAllowance = calculateBowAllowance(calculateModelCount(army));
    if (calculateBowCount(army) >= bowAllowance) {
      return {
        code: "BOW_LIMIT_EXCEEDED",
        severity: "error",
        message: `Bow limit reached (${bowAllowance})! You cannot add more bows.`,
        heroName: hero.name,
        heroIndex: army.heroes.indexOf(hero),
      };
    }
  }

  return null;
}

export function validateArmy(army: Army): ValidationResult {
  const issues: ValidationIssue[] = [];

  army.heroes.forEach((hero, heroIndex) => {
    const warbandCount = calculateWarbandModelCount(hero.warband);
    if (warbandCount > calculateTierCapacity(hero.tier)) {
      issues.push(capacityIssue(hero, heroIndex));
    }

    if (hero.tier === "independent" && warbandCount > 0) {
      issues.push({
        code: "INDEPENDENT_HERO_LEADING_WARBAND",
        severity: "error",
        message: `${hero.name} cannot lead a warband.`,
        heroName: hero.name,
        heroIndex,
      });
    }

    if (
      hero.selected &&
      hero.tier === "independent" &&
      army.heroes.some(
        (candidate, candidateIndex) =>
          candidateIndex < heroIndex &&
          candidate.selected &&
          candidate.tier === "independent" &&
          candidate.name === hero.name,
      )
    ) {
      issues.push({
        code: "INDEPENDENT_HERO_DUPLICATED",
        severity: "error",
        message: `${hero.name} is selected more than once.`,
        heroName: hero.name,
        heroIndex,
      });
    }

    if (hero.mandatory && !hero.selected) {
      issues.push({
        code: "MANDATORY_HERO_REQUIRED",
        severity: "error",
        message: `${hero.name} is required in this army.`,
        heroName: hero.name,
        heroIndex,
      });
    }

    if (hero.mustBeGeneral && (!hero.selected || !hero.isGeneral)) {
      issues.push({
        code: "REQUIRED_GENERAL_MISSING",
        severity: "error",
        message: `${hero.name} must be this army's General.`,
        heroName: hero.name,
        heroIndex,
      });
    }
  });

  const bowCount = calculateBowCount(army);
  const bowAllowance = calculateBowAllowance(calculateModelCount(army));
  if (bowCount > bowAllowance) {
    issues.push({
      code: "BOW_LIMIT_EXCEEDED",
      severity: "error",
      message: `Army has ${bowCount} bows but its current limit is ${bowAllowance}.`,
    });
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return { isValid: errors.length === 0, errors, warnings };
}
