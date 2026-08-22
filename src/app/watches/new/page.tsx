import { WatchForm } from "@/components/WatchForm";
import { PageHeader } from "@/components/layout/PageHeader";

interface NewWatchPageProps {
  searchParams: Promise<{
    name?: string;
    category?: string;
    keywords?: string;
    minPrice?: string;
    maxPrice?: string;
    countries?: string;
  }>;
}

export default async function NewWatchPage({ searchParams }: NewWatchPageProps) {
  const params = await searchParams;
  const countries = params.countries ? params.countries.split(",").filter(Boolean) : undefined;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Nové sledovanie"
        description="Nastav kategóriu a filtre pre monitorovanie"
      />
      <WatchForm
        defaultValues={{
          name: params.name,
          category: params.category,
          keywords: params.keywords,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          countries,
        }}
      />
    </div>
  );
}
