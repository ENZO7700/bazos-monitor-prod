import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="O aplikácii"
        description="Zdroj dát, súkromie a podmienky používania"
      />

      <Card>
        <CardHeader>
          <CardTitle>Zdroj dát</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Bazoš Monitor používa výhradne verejné RSS feedy z{" "}
            <a
              href="https://www.bazos.sk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              Bazoš.sk
            </a>
            . Aplikácia nevykonáva scraping mimo oficiálnych RSS kanálov.
          </p>
          <p>
            Odkazy na inzeráty vedú priamo na Bazoš. Rešpektuj podmienky používania
            služby Bazoš.sk a rozumné intervaly obnovovania (odporúčané 10+ minút).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Súkromie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Push notifikácie ukladajú subscription endpoint a kryptografické kľúče v
            databáze, aby bolo možné posielať upozornenia na nové inzeráty.
          </p>
          <p>
            Sledovania, inzeráty a preferencie sa ukladajú v PostgreSQL databáze
            (lokálne alebo na Neon v produkcii). Offline cache v prehliadači používa
            IndexedDB a localStorage len na zariadení používateľa.
          </p>
          <p>Žiadne údaje sa nepredávajú tretím stranám.</p>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        <Link href="/settings" className="text-primary underline-offset-4 hover:underline">
          ← Späť na nastavenia
        </Link>
      </p>
    </div>
  );
}
