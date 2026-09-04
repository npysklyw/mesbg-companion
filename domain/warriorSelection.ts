export type WarriorWargearChoice = readonly [name: string, cost: number];

export function getAvailableWarriorWargear(
  choices: readonly WarriorWargearChoice[],
  counts: Readonly<Record<string, number>>,
): WarriorWargearChoice[] {
  return choices.filter(([name]) => (counts[name] ?? 0) <= 0);
}

