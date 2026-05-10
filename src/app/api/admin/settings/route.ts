import { NextRequest, NextResponse } from "next/server";
import { readAdminSettings, updateAdminSettings } from "@/lib/admin-store";

const ADMIN_USERNAME = "admin123";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ settings: await readAdminSettings() });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await updateAdminSettings(await req.json());
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cannot update settings" },
      { status: 400 }
    );
  }
}

function isAdminRequest(req: NextRequest) {
  return req.headers.get("x-admin-user") === ADMIN_USERNAME;
}

