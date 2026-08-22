export interface BazosCategory {
  code: string;
  name: string;
}

export const BAZOS_CATEGORIES: BazosCategory[] = [
  { code: "au", name: "Auto" },
  { code: "mo", name: "Mobilné telefóny" },
  { code: "pc", name: "PC" },
  { code: "re", name: "Reality" },
  { code: "na", name: "Nábytok" },
  { code: "sp", name: "Šport" },
  { code: "hu", name: "Hudba" },
  { code: "de", name: "Deti" },
  { code: "zv", name: "Zvieratá" },
  { code: "st", name: "Stroje" },
  { code: "do", name: "Dom a záhrada" },
  { code: "sl", name: "Služby" },
  { code: "pr", name: "Práca" },
  { code: "mc", name: "Motocykle" },
  { code: "os", name: "Hodinky" },
];

export function getCategoryName(code: string): string {
  return BAZOS_CATEGORIES.find((c) => c.code === code)?.name ?? code;
}
