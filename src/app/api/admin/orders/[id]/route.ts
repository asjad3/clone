import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import {
    fetchAdminOrderById,
    fetchAdminOrderStatusById,
    updateAdminOrderStatus,
} from "@/lib/supabase/admin-dal";
import {
    adminJson,
    assertOrderStatus,
    canTransitionOrderStatus,
    ensureAdmin,
    handleAdminError,
    parseUuidParam,
} from "@/lib/api/admin-route";
import { parseOrderStatusPayload } from "@/lib/api/admin-validations";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const { id } = await params;
        const parsedId = parseUuidParam(id, "order id");
        const data = await fetchAdminOrderById(parsedId);
        if (!data) return adminJson({ error: "Not found" }, { status: 404 });
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to fetch order");
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const { id } = await params;
        const parsedId = parseUuidParam(id, "order id");
        const body = await req.json();
        const { status } = parseOrderStatusPayload(body);

        const currentStatusRaw = await fetchAdminOrderStatusById(parsedId);
        if (!currentStatusRaw) {
            return adminJson({ error: "Not found" }, { status: 404 });
        }

        const currentStatus = assertOrderStatus(currentStatusRaw);
        if (!canTransitionOrderStatus(currentStatus, status)) {
            return adminJson(
                {
                    error: `Invalid order status transition: ${currentStatus} -> ${status}`,
                },
                { status: 400 }
            );
        }

        const data = await updateAdminOrderStatus(parsedId, status);
        revalidateTag("orders", "max");
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to update order status");
    }
}
