import { NextResponse } from "next/server";
import { getMarketIndicators } from "@/services/bcb/bcb-client";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const indicators = await getMarketIndicators();
  const cacheControl = process.env.BCB_API_BASE_URL
    ? "no-store"
    : "public, s-maxage=3600, stale-while-revalidate=7200";

  return NextResponse.json(indicators, {
    status: 200,
    headers: {
      "Cache-Control": cacheControl,
    },
  });
}
