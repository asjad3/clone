import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminCategories, createAdminCategory } from "@/lib/supabase/admin-dal";
import { NextRequest } from "next/server";

export async function GET() {
    const data = await fetchAdminCategories();
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = await createAdminCategory(body);
        revalidateTag("products", "max"); // categories affect product display
        return NextResponse.json(data, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create category";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
