import { NextRequest, NextResponse } from "next/server";
import { fetchAdminOrders } from "@/lib/supabase/admin-dal";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? "0");
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const status = url.searchParams.get("status") ?? undefined;

    const result = await fetchAdminOrders({ page, limit, status });
    return NextResponse.json(result);
}
