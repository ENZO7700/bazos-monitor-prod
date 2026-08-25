import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { db } from "@/lib/db";
import { pushSubscribeSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = pushSubscribeSchema.parse(body);

    await db.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: {
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
      },
      update: {
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    }
    await db.pushSubscription.delete({ where: { endpoint } }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
