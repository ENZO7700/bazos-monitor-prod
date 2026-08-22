import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <WifiOff className="h-16 w-16 text-muted-foreground" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Si offline</h1>
        <p className="max-w-md text-muted-foreground">
          Táto stránka nie je dostupná bez internetu. Skús sa vrátiť na uložené
          inzeráty alebo počkaj na obnovenie pripojenia.
        </p>
      </div>
      <Button asChild>
        <Link href="/listings">Prejsť na inzeráty</Link>
      </Button>
    </div>
  );
}
