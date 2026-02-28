import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminAreas, createAdminArea } from "@/lib/supabase/admin-dal";
import { NextRequest } from "next/server";

export async function GET() {
    const data = await fetchAdminAreas();
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = await createAdminArea(body);
        revalidateTag("areas", "max");
        return NextResponse.json(data, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create area";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
