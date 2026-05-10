import { NextRequest, NextResponse } from "next/server";
import {
  createAdminUser,
  deleteAdminUser,
  readAdminUsers,
  updateAdminUser,
} from "@/lib/admin-store";

const ADMIN_USERNAME = "admin123";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ users: await readAdminUsers() });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await createAdminUser(await req.json());
    return NextResponse.json({ user, users: await readAdminUsers() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cannot create user" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    const user = await updateAdminUser(body.id, body);
    return NextResponse.json({ user, users: await readAdminUsers() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cannot update user" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  try {
    await deleteAdminUser(id);
    return NextResponse.json({ users: await readAdminUsers() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cannot delete user" },
      { status: 400 }
    );
  }
}

function isAdminRequest(req: NextRequest) {
  return req.headers.get("x-admin-user") === ADMIN_USERNAME;
}
