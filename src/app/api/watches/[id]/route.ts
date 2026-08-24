import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
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
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  await db.watch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
