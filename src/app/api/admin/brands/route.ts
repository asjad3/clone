import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminBrands, createAdminBrand } from "@/lib/supabase/admin-dal";
import { adminJson, ensureAdmin, handleAdminError } from "@/lib/api/admin-route";
import { parseBrandPayload } from "@/lib/api/admin-validations";

export async function GET(req: NextRequest) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const data = await fetchAdminBrands();
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to fetch brands");
    }
}

export async function POST(req: NextRequest) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const body = await req.json();
        const data = await createAdminBrand(parseBrandPayload(body, "create"));
        revalidateTag("products", "max"); // brands affect product display
        return adminJson(data, { status: 201 });
    } catch (error) {
        return handleAdminError(error, "Failed to create brand");
    }
}
