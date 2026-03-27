import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminCategories, createAdminCategory } from "@/lib/supabase/admin-dal";
import { adminJson, ensureAdmin, handleAdminError } from "@/lib/api/admin-route";
import { parseCategoryPayload } from "@/lib/api/admin-validations";

export async function GET(req: NextRequest) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const data = await fetchAdminCategories();
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to fetch categories");
    }
}

export async function POST(req: NextRequest) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const body = await req.json();
        const data = await createAdminCategory(parseCategoryPayload(body, "create"));
        revalidateTag("products", "max"); // categories affect product display
        return adminJson(data, { status: 201 });
    } catch (error) {
        return handleAdminError(error, "Failed to create category");
    }
}
