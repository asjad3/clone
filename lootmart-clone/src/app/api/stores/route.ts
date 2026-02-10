import { NextResponse } from "next/server";
import { stores } from "@/lib/data";

export async function GET() {
  return NextResponse.json(stores);
}
