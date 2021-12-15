export function isAnyMissing(...parameters: any[]): boolean {
  for (const param of parameters) {
    if (param === null || param === undefined) {
      return true;
    }
  }
  return false;
}

export function isAllPresent(...parameters: any[]): boolean {
  return !isAnyMissing(...parameters);
}
