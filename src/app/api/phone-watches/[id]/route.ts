import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiErrorResponse } from "@/lib/api-error";
import { normalizePhoneE164 } from "@/lib/bazos-phone";
import { updatePhoneWatchSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updatePhoneWatchSchema.parse(body);

    const update: {
      label?: string | null;
      notes?: string | null;
      active?: boolean;
      phoneE164?: string;
      phoneRaw?: string;
    } = {};

    if (data.label !== undefined) update.label = data.label?.trim() || null;
    if (data.notes !== undefined) update.notes = data.notes?.trim() || null;
    if (data.active !== undefined) update.active = data.active;

    if (data.phone) {
      const phoneE164 = normalizePhoneE164(data.phone);
      if (!phoneE164) {
        return NextResponse.json(
          { error: "Neplatné telefónne číslo (očakávaný SK/CZ formát)" },
          { status: 400 }
        );
      }
      update.phoneE164 = phoneE164;
      update.phoneRaw = data.phone.trim();
    }

    const watch = await db.phoneWatch.update({
      where: { id },
      data: update,
    });

    return NextResponse.json(watch);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    if (message.includes("Record to update not found") || message.includes("P2025")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await db.phoneWatch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
