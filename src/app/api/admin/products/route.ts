import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminProducts, createAdminProduct } from "@/lib/supabase/admin-dal";
import {
    adminJson,
    ensureAdmin,
    handleAdminError,
    parseLimitParam,
    parseOptionalSearch,
    parsePageParam,
} from "@/lib/api/admin-route";
import { parseProductPayload } from "@/lib/api/admin-validations";

export async function GET(req: NextRequest) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const url = new URL(req.url);
        const page = parsePageParam(url.searchParams.get("page"), 0, 10000);
        const limit = parseLimitParam(url.searchParams.get("limit"), 20, 100);
        const search = parseOptionalSearch(url.searchParams.get("search"), 100);

        const result = await fetchAdminProducts({ page, limit, search });
        return adminJson(result);
    } catch (error) {
        return handleAdminError(error, "Failed to fetch products");
    }
}

export async function POST(req: NextRequest) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const rawBody = await req.json();
        const data = await createAdminProduct(parseProductPayload(rawBody, "create"));
        revalidateTag("products", "max");
        return adminJson(data, { status: 201 });
    } catch (error) {
        return handleAdminError(error, "Failed to create product");
    }
}
