import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminStoreProducts, createAdminStoreProduct } from "@/lib/supabase/admin-dal";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? "0");
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const search = url.searchParams.get("search") ?? undefined;
    const storeId = url.searchParams.get("store_id") ? Number(url.searchParams.get("store_id")) : undefined;

    const result = await fetchAdminStoreProducts({ storeId, page, limit, search });
    return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = await createAdminStoreProduct(body);
        revalidateTag("products", "max");
        return NextResponse.json(data, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create store product";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
