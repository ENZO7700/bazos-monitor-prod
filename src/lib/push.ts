import webpush from "web-push";
import { db } from "./db";

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPushNotification(
  title: string,
  body: string,
  url: string
): Promise<number> {
  if (!configureWebPush()) return 0;

  const subscriptions = await db.pushSubscription.findMany();
  let sent = 0;

  const payload = JSON.stringify({ title, body, url });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      sent++;
    } catch {
      await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    }
  }

  return sent;
}
