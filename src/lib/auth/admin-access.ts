const DEFAULT_DEV_ADMIN_EMAILS = ["admin@lootmart.pk"];

let cachedAdminEmails: Set<string> | null = null;

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function buildAdminEmailSet(): Set<string> {
    const configured = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map(normalizeEmail)
        .filter(Boolean);

    if (configured.length > 0) {
        return new Set(configured);
    }

    if (process.env.NODE_ENV !== "production") {
        return new Set(DEFAULT_DEV_ADMIN_EMAILS);
    }

    return new Set();
}

function getAdminEmailSet(): Set<string> {
    if (!cachedAdminEmails) {
        cachedAdminEmails = buildAdminEmailSet();
    }
    return cachedAdminEmails;
}

export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    return getAdminEmailSet().has(normalizeEmail(email));
}
