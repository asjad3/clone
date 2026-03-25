import { NextResponse } from "next/server";
import { areas } from "@/lib/data";

export async function GET() {
  return NextResponse.json(areas);
}
