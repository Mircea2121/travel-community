export const SITE_CONFIG = Object.freeze({
  name: "Comunitatea Călătorilor",
  domain: "comunitatea-calatorilor.ro",
  operatorName: "Administratorul Comunitatea Călătorilor",
  contactEmail:
    process.env.SUPPORT_EMAIL?.trim() || "mirczenn@gmail.com",
  minimumAge: 16,
  jurisdiction: "România",
  legalUpdatedAt: "12 august 2026",
});

