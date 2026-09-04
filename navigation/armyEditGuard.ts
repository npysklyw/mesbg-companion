type ArmyEditGuard = (proceed: () => void) => void;

let activeGuard: ArmyEditGuard | null = null;

export function registerArmyEditGuard(guard: ArmyEditGuard): () => void {
  activeGuard = guard;
  return () => {
    if (activeGuard === guard) activeGuard = null;
  };
}

export function requestArmyEditExit(proceed: () => void): void {
  if (activeGuard) activeGuard(proceed);
  else proceed();
}

