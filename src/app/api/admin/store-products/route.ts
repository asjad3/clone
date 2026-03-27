import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminStoreProducts, createAdminStoreProduct } from "@/lib/supabase/admin-dal";
import {
    adminJson,
    ensureAdmin,
    handleAdminError,
    parseLimitParam,
    parseOptionalPositiveInt,
    parseOptionalSearch,
    parsePageParam,
} from "@/lib/api/admin-route";
import { parseStoreProductPayload } from "@/lib/api/admin-validations";

export async function GET(req: NextRequest) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const url = new URL(req.url);
        const page = parsePageParam(url.searchParams.get("page"), 0, 10000);
        const limit = parseLimitParam(url.searchParams.get("limit"), 20, 100);
        const search = parseOptionalSearch(url.searchParams.get("search"), 100);
        const storeId = parseOptionalPositiveInt(url.searchParams.get("store_id"), "store_id");

        const result = await fetchAdminStoreProducts({ storeId, page, limit, search });
        return adminJson(result);
    } catch (error) {
        return handleAdminError(error, "Failed to fetch store products");
    }
}

export async function POST(req: NextRequest) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const body = await req.json();
        const data = await createAdminStoreProduct(parseStoreProductPayload(body, "create"));
        revalidateTag("products", "max");
        return adminJson(data, { status: 201 });
    } catch (error) {
        return handleAdminError(error, "Failed to create store product");
    }
}
