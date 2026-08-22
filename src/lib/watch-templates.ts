export interface WatchTemplateInput {
  name: string;
  category: string;
  keywords: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  countries?: string[];
}

export interface WatchTemplate {
  id: string;
  title: string;
  description: string;
  icon: "smartphone" | "car" | "home" | "gamepad" | "laptop" | "settings";
  watch?: WatchTemplateInput;
  href?: string;
}

export const WATCH_TEMPLATES: WatchTemplate[] = [
  {
    id: "iphone-cz",
    title: "🇨🇿 iPhone 16 / 17 (Praha & ČR)",
    description: "Bazoš.cz — Najnovšie Apple smartfóny",
    icon: "smartphone",
    watch: {
      name: "iPhone 16 / 17 (Praha & ČR)",
      category: "mo",
      keywords: ["iphone"],
      countries: ["CZ"],
    },
  },
  {
    id: "macbook-cz",
    title: "🇨🇿 MacBook od 20 000 Kč",
    description: "Bazoš.cz — Apple Silicon notebooky",
    icon: "laptop",
    watch: {
      name: "MacBook od 20 000 Kč",
      category: "pc",
      keywords: ["macbook"],
      minPrice: 20000,
      countries: ["CZ"],
    },
  },
  {
    id: "razer-cz",
    title: "🇨🇿 Notebook Razer Gaming",
    description: "Bazoš.cz — Herné notebooky Razer Blade",
    icon: "laptop",
    watch: {
      name: "Notebook Razer Gaming",
      category: "pc",
      keywords: ["razer"],
      countries: ["CZ"],
    },
  },
  {
    id: "phone",
    title: "Mobil do 400 €",
    description: "iPhone a smartfóny",
    icon: "smartphone",
    watch: {
      name: "Mobil do 400 €",
      category: "mo",
      keywords: ["iphone"],
      maxPrice: 400,
      countries: ["SK", "CZ"],
    },
  },
  {
    id: "car",
    title: "Auto do 8 000 €",
    description: "Ojazdené autá",
    icon: "car",
    watch: {
      name: "Auto do 8 000 €",
      category: "au",
      keywords: [],
      maxPrice: 8000,
      countries: ["SK", "CZ"],
    },
  },
  {
    id: "console",
    title: "Herná konzola",
    description: "PS5, Xbox, Nintendo",
    icon: "gamepad",
    watch: {
      name: "Herná konzola",
      category: "pc",
      keywords: ["ps5", "xbox", "nintendo"],
      countries: ["SK", "CZ"],
    },
  },
  {
    id: "custom",
    title: "Vlastné nastavenie",
    description: "Pokročilé filtre a kategórie",
    icon: "settings",
    href: "/watches/new",
  },
];
