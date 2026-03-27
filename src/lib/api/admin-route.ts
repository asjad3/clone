import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin-guard";

const NO_STORE_HEADERS: Record<string, string> = {
    "Cache-Control": "private, no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
};

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const ORDER_STATUSES = [
    "pending",
    "confirmed",
    "preparing",
    "ready_for_pickup",
    "picked_up",
    "in_transit",
    "delivered",
    "cancelled",
    "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STORE_STATUSES = ["pending", "active", "suspended", "closed"] as const;

const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["ready_for_pickup", "cancelled"],
    ready_for_pickup: ["picked_up", "cancelled"],
    picked_up: ["in_transit", "cancelled"],
    in_transit: ["delivered", "cancelled"],
    delivered: ["refunded"],
    cancelled: ["refunded"],
    refunded: [],
};

export class AdminApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "AdminApiError";
        this.status = status;
    }
}

export function withNoStoreHeaders(response: NextResponse) {
    for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
        response.headers.set(key, value);
    }
    return response;
}

export function adminJson(payload: unknown, init: ResponseInit = {}) {
    const headers = new Headers(init.headers);
    for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
        headers.set(key, value);
    }
    return NextResponse.json(payload, {
        ...init,
        headers,
    });
}

export function adminError(status: number, message: string, details?: unknown) {
    if (details !== undefined) {
        return adminJson({ error: message, details }, { status });
    }
    return adminJson({ error: message }, { status });
}

export function handleAdminError(error: unknown, fallbackMessage = "Internal server error") {
    if (error instanceof AdminApiError) {
        return adminError(error.status, error.message);
    }

    if (error instanceof Error) {
        return adminError(400, error.message || fallbackMessage);
    }

    console.error("[AdminAPI] unexpected error", error);
    return adminError(500, fallbackMessage);
}

export async function ensureAdmin(req: NextRequest) {
    const authResult = await requireAdmin(req);
    if (!authResult.authorized) {
        return {
            authorized: false as const,
            response: withNoStoreHeaders(authResult.response),
        };
    }

    return {
        authorized: true as const,
        session: authResult.session,
    };
}

export function parseIdParam(raw: string, fieldName = "id") {
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1) {
        throw new AdminApiError(400, `${fieldName} must be a positive integer`);
    }
    return value;
}

export function parseUuidParam(raw: string, fieldName = "id") {
    if (!UUID_REGEX.test(raw)) {
        throw new AdminApiError(400, `${fieldName} must be a valid UUID`);
    }
    return raw;
}

export function parsePageParam(raw: string | null, defaultValue = 0, max = 10000) {
    if (!raw) return defaultValue;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0 || value > max) {
        throw new AdminApiError(400, `page must be an integer between 0 and ${max}`);
    }
    return value;
}

export function parseLimitParam(raw: string | null, defaultValue = 20, max = 100) {
    if (!raw) return defaultValue;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1 || value > max) {
        throw new AdminApiError(400, `limit must be an integer between 1 and ${max}`);
    }
    return value;
}

export function parseOptionalSearch(raw: string | null, maxLength = 100) {
    if (!raw) return undefined;
    const value = raw.trim();
    if (!value) return undefined;
    return value.slice(0, maxLength);
}

export function parseOptionalPositiveInt(raw: string | null, fieldName: string) {
    if (!raw) return undefined;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1) {
        throw new AdminApiError(400, `${fieldName} must be a positive integer`);
    }
    return value;
}

export function ensureObject(input: unknown, message = "Invalid JSON body") {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new AdminApiError(400, message);
    }
    return input as Record<string, unknown>;
}

export function readRequiredString(
    obj: Record<string, unknown>,
    key: string,
    opts: {
        maxLength?: number;
        pattern?: RegExp;
    } = {}
) {
    const value = obj[key];
    if (typeof value !== "string") {
        throw new AdminApiError(400, `${key} is required`);
    }

    const normalized = value.trim();
    if (!normalized) {
        throw new AdminApiError(400, `${key} cannot be empty`);
    }

    if (opts.maxLength && normalized.length > opts.maxLength) {
        throw new AdminApiError(400, `${key} must be at most ${opts.maxLength} characters`);
    }

    if (opts.pattern && !opts.pattern.test(normalized)) {
        throw new AdminApiError(400, `${key} is invalid`);
    }

    return normalized;
}

export function readOptionalString(
    obj: Record<string, unknown>,
    key: string,
    opts: {
        maxLength?: number;
        pattern?: RegExp;
        allowEmpty?: boolean;
    } = {}
) {
    const value = obj[key];
    if (value === undefined) return undefined;

    if (typeof value !== "string") {
        throw new AdminApiError(400, `${key} must be a string`);
    }

    const normalized = value.trim();

    if (!opts.allowEmpty && !normalized) {
        throw new AdminApiError(400, `${key} cannot be empty`);
    }

    if (opts.maxLength && normalized.length > opts.maxLength) {
        throw new AdminApiError(400, `${key} must be at most ${opts.maxLength} characters`);
    }

    if (opts.pattern && normalized && !opts.pattern.test(normalized)) {
        throw new AdminApiError(400, `${key} is invalid`);
    }

    return normalized;
}

export function readNullableString(
    obj: Record<string, unknown>,
    key: string,
    opts: {
        maxLength?: number;
        pattern?: RegExp;
    } = {}
) {
    const value = obj[key];
    if (value === undefined) return undefined;
    if (value === null) return null;

    if (typeof value !== "string") {
        throw new AdminApiError(400, `${key} must be a string or null`);
    }

    const normalized = value.trim();
    if (!normalized) return null;

    if (opts.maxLength && normalized.length > opts.maxLength) {
        throw new AdminApiError(400, `${key} must be at most ${opts.maxLength} characters`);
    }

    if (opts.pattern && !opts.pattern.test(normalized)) {
        throw new AdminApiError(400, `${key} is invalid`);
    }

    return normalized;
}

export function readRequiredNumber(
    obj: Record<string, unknown>,
    key: string,
    opts: {
        min?: number;
        max?: number;
        integer?: boolean;
    } = {}
) {
    const value = obj[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new AdminApiError(400, `${key} must be a valid number`);
    }

    if (opts.integer && !Number.isInteger(value)) {
        throw new AdminApiError(400, `${key} must be an integer`);
    }

    if (opts.min !== undefined && value < opts.min) {
        throw new AdminApiError(400, `${key} must be at least ${opts.min}`);
    }

    if (opts.max !== undefined && value > opts.max) {
        throw new AdminApiError(400, `${key} must be at most ${opts.max}`);
    }

    return value;
}

export function readOptionalNumber(
    obj: Record<string, unknown>,
    key: string,
    opts: {
        min?: number;
        max?: number;
        integer?: boolean;
    } = {}
) {
    const value = obj[key];
    if (value === undefined) return undefined;
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new AdminApiError(400, `${key} must be a valid number`);
    }

    if (opts.integer && !Number.isInteger(value)) {
        throw new AdminApiError(400, `${key} must be an integer`);
    }

    if (opts.min !== undefined && value < opts.min) {
        throw new AdminApiError(400, `${key} must be at least ${opts.min}`);
    }

    if (opts.max !== undefined && value > opts.max) {
        throw new AdminApiError(400, `${key} must be at most ${opts.max}`);
    }

    return value;
}

export function readNullableNumber(
    obj: Record<string, unknown>,
    key: string,
    opts: {
        min?: number;
        max?: number;
        integer?: boolean;
    } = {}
) {
    const value = obj[key];
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new AdminApiError(400, `${key} must be a valid number or null`);
    }

    if (opts.integer && !Number.isInteger(value)) {
        throw new AdminApiError(400, `${key} must be an integer`);
    }

    if (opts.min !== undefined && value < opts.min) {
        throw new AdminApiError(400, `${key} must be at least ${opts.min}`);
    }

    if (opts.max !== undefined && value > opts.max) {
        throw new AdminApiError(400, `${key} must be at most ${opts.max}`);
    }

    return value;
}

export function readOptionalBoolean(obj: Record<string, unknown>, key: string) {
    const value = obj[key];
    if (value === undefined) return undefined;
    if (typeof value !== "boolean") {
        throw new AdminApiError(400, `${key} must be a boolean`);
    }
    return value;
}

export function readOptionalEnum<T extends string>(
    obj: Record<string, unknown>,
    key: string,
    allowed: readonly T[]
) {
    const value = obj[key];
    if (value === undefined) return undefined;
    if (typeof value !== "string") {
        throw new AdminApiError(400, `${key} must be a string`);
    }
    if (!allowed.includes(value as T)) {
        throw new AdminApiError(400, `${key} is invalid`);
    }
    return value as T;
}

export function readRequiredEnum<T extends string>(
    obj: Record<string, unknown>,
    key: string,
    allowed: readonly T[]
) {
    const value = obj[key];
    if (typeof value !== "string") {
        throw new AdminApiError(400, `${key} is required`);
    }
    if (!allowed.includes(value as T)) {
        throw new AdminApiError(400, `${key} is invalid`);
    }
    return value as T;
}

export function readRequiredBoolean(obj: Record<string, unknown>, key: string) {
    const value = obj[key];
    if (typeof value !== "boolean") {
        throw new AdminApiError(400, `${key} must be a boolean`);
    }
    return value;
}

export function readOptionalObject(obj: Record<string, unknown>, key: string) {
    const value = obj[key];
    if (value === undefined) return undefined;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new AdminApiError(400, `${key} must be an object`);
    }
    return value as Record<string, unknown>;
}

export function readOptionalStringArray(obj: Record<string, unknown>, key: string) {
    const value = obj[key];
    if (value === undefined) return undefined;
    if (!Array.isArray(value)) {
        throw new AdminApiError(400, `${key} must be an array of strings`);
    }

    const out: string[] = [];
    for (const item of value) {
        if (typeof item !== "string") {
            throw new AdminApiError(400, `${key} must contain only strings`);
        }
        const normalized = item.trim();
        if (normalized) {
            out.push(normalized);
        }
    }
    return out;
}

export function readRequiredUuid(obj: Record<string, unknown>, key: string) {
    const value = readRequiredString(obj, key);
    if (!UUID_REGEX.test(value)) {
        throw new AdminApiError(400, `${key} must be a valid UUID`);
    }
    return value;
}

export function slugifyDash(input: string) {
    const slug = input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    if (!slug) {
        throw new AdminApiError(400, "slug is invalid");
    }

    return slug;
}

export function slugifyLtree(input: string) {
    const slug = input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .replace(/_+/g, "_");

    if (!slug) {
        throw new AdminApiError(400, "slug is invalid");
    }

    const startsWithAllowed = /^[a-z_]/.test(slug);
    const safeSlug = startsWithAllowed ? slug : `_${slug}`;

    if (!/^[a-z_][a-z0-9_]*$/.test(safeSlug)) {
        throw new AdminApiError(400, "slug must be ltree-safe (letters, digits, underscores)");
    }

    return safeSlug;
}

export function assertOrderStatus(value: unknown): OrderStatus {
    if (typeof value !== "string") {
        throw new AdminApiError(400, "status must be a string");
    }

    if (!ORDER_STATUSES.includes(value as OrderStatus)) {
        throw new AdminApiError(400, "Invalid order status");
    }

    return value as OrderStatus;
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus) {
    if (from === to) return true;
    return ORDER_TRANSITIONS[from].includes(to);
}
