import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminBrands, createAdminBrand } from "@/lib/supabase/admin-dal";
import { NextRequest } from "next/server";

export async function GET() {
    const data = await fetchAdminBrands();
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = await createAdminBrand(body);
        revalidateTag("products", "max"); // brands affect product display
        return NextResponse.json(data, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create brand";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
