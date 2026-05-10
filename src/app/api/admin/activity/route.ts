import { NextRequest, NextResponse } from "next/server";
import { readAdminActivity } from "@/lib/admin-store";

const ADMIN_USERNAME = "admin123";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-user") !== ADMIN_USERNAME) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ activity: await readAdminActivity(60) });
}
