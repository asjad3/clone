import { NextRequest } from "next/server";
import { fetchAdminOrders } from "@/lib/supabase/admin-dal";
import {
    adminJson,
    ensureAdmin,
    handleAdminError,
    ORDER_STATUSES,
    parseLimitParam,
    parsePageParam,
} from "@/lib/api/admin-route";

export async function GET(req: NextRequest) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const url = new URL(req.url);
        const page = parsePageParam(url.searchParams.get("page"), 0, 10000);
        const limit = parseLimitParam(url.searchParams.get("limit"), 20, 100);
        const statusParam = url.searchParams.get("status");
        let status: string | undefined;

        if (statusParam) {
            if (statusParam === "all") {
                status = "all";
            } else if (ORDER_STATUSES.includes(statusParam as (typeof ORDER_STATUSES)[number])) {
                status = statusParam;
            } else {
                return adminJson({ error: "Invalid status filter" }, { status: 400 });
            }
        }

        const result = await fetchAdminOrders({ page, limit, status });
        return adminJson(result);
    } catch (error) {
        return handleAdminError(error, "Failed to fetch orders");
    }
}
