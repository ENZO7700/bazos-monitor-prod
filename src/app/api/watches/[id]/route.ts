import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateWatchSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateWatchSchema.parse(body);

    const watch = await db.watch.update({
      where: { id },
      data,
    });

    return NextResponse.json(watch);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  await db.watch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
