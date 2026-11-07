export const serviceIds = [
  "learning",
  "administration",
  "network",
  "devices",
  "support",
] as const;
export const mediaKinds = [
  "ecosystem",
  ...serviceIds,
  "implementation",
  "contact",
] as const;
