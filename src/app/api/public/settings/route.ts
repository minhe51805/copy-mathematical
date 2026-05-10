import { NextResponse } from "next/server";
import { readAdminSettings } from "@/lib/admin-store";

export async function GET() {
  const settings = await readAdminSettings();

  return NextResponse.json({
    guestChatLimit: settings.guestChatLimit,
  });
}

