import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminStores, createAdminStore } from "@/lib/supabase/admin-dal";
import { adminJson, ensureAdmin, handleAdminError } from "@/lib/api/admin-route";
import { parseStorePayload } from "@/lib/api/admin-validations";

export async function GET(req: NextRequest) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const data = await fetchAdminStores();
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to fetch stores");
    }
}

export async function POST(req: NextRequest) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const body = await req.json();
        const data = await createAdminStore(parseStorePayload(body, "create"));
        revalidateTag("stores", "max");
        revalidateTag("areas", "max");
        return adminJson(data, { status: 201 });
    } catch (error) {
        return handleAdminError(error, "Failed to create store");
    }
}
