import { BAZOS_CATEGORIES } from "@/lib/categories";

export interface MistralParsedWatch {
  name: string;
  category: string;
  keywords: string[];
  minPrice: number | null;
  maxPrice: number | null;
  countries: Array<"SK" | "CZ">;
  currency?: "EUR" | "CZK" | "BOTH";
  reasoning?: string;
}

export const MISTRAL_PRODUCTION_SYSTEM_PROMPT = `Si špecializovaný AI asistent pre Bazoš Monitor PWA (bazos.sk a bazos.cz).
Tvojou jedinou úlohou je transformovať prirodzený používateľský dopyt (v slovenčine alebo češtine) do presnej JSON štruktúry pre RSS monitorovanie.

DOSTUPNÉ KATEGÓRIE BAZOŠU (použi výhradne tieto kódy):
- "au": Auto (osobné autá, náhradné diely, kolesá, disky)
- "mo": Mobilné telefóny (smartfóny, príslušenstvo, púzdra, nabíjačky)
- "pc": PC (počítače, notebooky, grafické karty, monitory, konzoly PS5/Xbox/Nintendo)
- "re": Reality (byty, domy, pozemky, prenájom, predaj)
- "na": Nábytok (stoly, stoličky, skrine, postele, sedacie súpravy)
- "sp": Šport (bicykle, lyže, fitness, turistika, posilňovňa)
- "hu": Hudba (hudobné nástroje, gitary, klavíry, aparatúra, audio)
- "de": Deti (kočíky, autosedačky, hračky, detské oblečenie)
- "zv": Zvieratá (psy, mačky, hospodárske zvieratá, chovateľské potreby)
- "st": Stroje (poľnohospodárske stroje, traktory, priemyselné stroje, stavebná technika)
- "do": Dom a záhrada (kosačky, náradie, stavebný materiál, rastliny, bazény)
- "sl": Služby (remeselníci, opravy, sťahovanie, preprava, doučovanie)
- "pr": Práca (ponuky práce, brigády, zamestnanie)
- "mc": Motocykle (motorky, skútre, štvorkolky, motodiely, prilby)
- "os": Hodinky a ostatné (náramkové hodinky, zberateľstvo, šperky, iné)

PRAVIDLÁ EXTRAKCIE:
1. "name": Stručný, reprezentatívny názov hľadaného predmetu (max 40 znakov).
2. "category": Presne 1 kód z vyššie uvedeného zoznamu 15 kategórií.
3. "keywords": Pole relevantných kľúčových slov v základnom tvare bez spojok, predložiek a zbytočných slov. Ak používateľ nezadal špecifické kľúčové slová, pole je prázdne [] — NENASTAVUJ žiadne vymyslené predvolené filtre!
4. "minPrice": Minimálna cena ako celé číslo alebo null, ak nebola zadaná.
5. "maxPrice": Maximálna cena ako celé číslo alebo null, ak nebola zadaná.
6. "countries": Pole ["SK"], ["CZ"] alebo ["SK", "CZ"]:
   - Ak dopyt obsahuje české lokality (Praha, Brno, Ostrava...), českú menu (Kč, CZK) alebo explicitne "v ČR/v Česku", nastav ["CZ"].
   - Ak dopyt obsahuje slovenské lokality (Bratislava, Košice, Žilina...), menu EUR/€ alebo explicitne "na Slovensku", nastav ["SK"].
   - Ak krajina nie je špecifikovaná, nastav ["SK", "CZ"].
7. FORMÁT ODPOVEDE: Výhradne validný JSON objekt, žiadny markdown okolo.

Príklad výstupu:
{
  "name": "Škoda Octavia Combi",
  "category": "au",
  "keywords": ["octavia", "combi"],
  "minPrice": null,
  "maxPrice": 7000,
  "countries": ["SK"],
  "currency": "EUR"
}`;

/**
 * Parsuje dopyt cez Mistral AI alebo lokálny offline fallback model.
 */
export async function parseQueryWithMistral(
  userQuery: string,
  apiKey: string | undefined = process.env.MISTRAL_API_KEY
): Promise<MistralParsedWatch> {
  const trimmed = userQuery.trim();
  if (!trimmed) {
    return {
      name: "Všetky inzeráty",
      category: "mo",
      keywords: [],
      minPrice: null,
      maxPrice: null,
      countries: ["SK", "CZ"],
    };
  }

  if (apiKey) {
    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            { role: "system", content: MISTRAL_PRODUCTION_SYSTEM_PROMPT },
            { role: "user", content: trimmed },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as MistralParsedWatch;
          return validateAndSanitizeMistralOutput(parsed, trimmed);
        }
      }
    } catch (err) {
      console.warn("Mistral API call failed, using deterministic classifier:", err);
    }
  }

  // Lokálny deterministický klasifikátor (offline fallback)
  return localMistralClassifier(trimmed);
}

function validateAndSanitizeMistralOutput(
  parsed: Partial<MistralParsedWatch>,
  fallbackQuery: string
): MistralParsedWatch {
  const validCategoryCodes = new Set(BAZOS_CATEGORIES.map((c) => c.code));
  const category =
    parsed.category && validCategoryCodes.has(parsed.category)
      ? parsed.category
      : "mo";

  const countries: Array<"SK" | "CZ"> =
    Array.isArray(parsed.countries) && parsed.countries.length > 0
      ? (parsed.countries.filter((c) => c === "SK" || c === "CZ") as Array<"SK" | "CZ">)
      : ["SK", "CZ"];

  return {
    name: parsed.name?.trim() || fallbackQuery.slice(0, 40),
    category,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map((k) => String(k).trim()).filter(Boolean) : [],
    minPrice: typeof parsed.minPrice === "number" && !isNaN(parsed.minPrice) ? parsed.minPrice : null,
    maxPrice: typeof parsed.maxPrice === "number" && !isNaN(parsed.maxPrice) ? parsed.maxPrice : null,
    countries: countries.length > 0 ? countries : ["SK", "CZ"],
    reasoning: parsed.reasoning,
  };
}

const CATEGORY_MAP: Array<{ code: string; patterns: RegExp[] }> = [
  { code: "au", patterns: [/(?:^|\s|[.,;])(auto|autá|auta|automobil|škoda|skoda|octavia|fabia|bmw|audi|vw|volkswagen|kolesa|disky|pneumatiky|motor|prevodovka)(?:$|\s|[.,;])/iu] },
  { code: "mo", patterns: [/(?:^|\s|[.,;])(mobil|mobily|smartf[oó]n|iphone|samsung|xiaomi|redmi|pixel|telef[oó]n|telefon|puzdro|kryt)(?:$|\s|[.,;])/iu] },
  { code: "pc", patterns: [/(?:^|\s|[.,;])(pc|počítač|pocitac|notebook|laptop|macbook|grafick[aá]|rtx|gtx|monitor|klavesnica|ps5|ps4|playstation|xbox|nintendo|switch)(?:$|\s|[.,;])/iu] },
  { code: "re", patterns: [/(?:^|\s|[.,;])(byt|byty|dom|domy|pozemok|reality|pren[aá]jom|pron[aá]jem|predaj bytu|gar[aá][zž]|chata)(?:$|\s|[.,;])/iu] },
  { code: "na", patterns: [/(?:^|\s|[.,;])(n[aá]bytok|n[aá]bytek|st[oô]l|stol|stoli[cč]k[ay]|skri[nň]a|skrin|poste[lľ]|postel|sedacka|sedačka|kreslo|komoda)(?:$|\s|[.,;])/iu] },
  { code: "sp", patterns: [/(?:^|\s|[.,;])(bicykel|kolo|ly[zž]e|snowboard|fitness|činky|cinky|posilňovňa|posilovna|turistika|stan|kolobežka|kolobezka|hokej|futbal)(?:$|\s|[.,;])/iu] },
  { code: "hu", patterns: [/(?:^|\s|[.,;])(gitara|kytara|klav[ií]r|bicie|kl[aá]vesy|reproduktor|zosil[nň]ova[cč]|mikrof[oó]n|mikrofon|audio|fender|gibson)(?:$|\s|[.,;])/iu] },
  { code: "de", patterns: [/(?:^|\s|[.,;])(ko[cč][ií]k|kocik|autoseda[cč]ka|lego|hra[cč]k[ay]|hracky|odr[aá][zž]adlo|postie[lľ]ka|detsky|detské|detske)(?:$|\s|[.,;])/iu] },
  { code: "zv", patterns: [/(?:^|\s|[.,;])(pes|psy|[sš]te[nň][a-zà-ž]*|šteniatko|šteňa|štene|ovčiak|ovčak|ovciak|ovcak|ma[cč]ka|macka|ma[cč]iatko|k[oô][nň]|kon|akv[aá]rium|papag[aá]j|ter[aá]rium|chov)(?:$|\s|[.,;])/iu] },
  { code: "st", patterns: [/(?:^|\s|[.,;])(traktor|zetor|bager|vysokozdvi[zž]n[yý]|s[uú]struh|fr[eé]za|stavebn[yý] stroj|kombajn|hydraulika)(?:$|\s|[.,;])/iu] },
  { code: "do", patterns: [/(?:^|\s|[.,;])(kosa[cč]ka|kosacka|p[ií]la|pila|stihl|husqvarna|vrta[cč]ka|vrtacka|krovinorez|alt[aá]nok|baz[eé]n|bazen|z[aá]hrada|zahrada|kotol)(?:$|\s|[.,;])/iu] },
  { code: "sl", patterns: [/(?:^|\s|[.,;])(slu[zž]b[ay]|sluzby|oprava|rekon[sš]trukcia|rekonstrukce|s[tť]ahovanie|maliar|obklada[cč]|obkladac|mur[aá]r|murar|preprava|dou[cč]ovanie)(?:$|\s|[.,;])/iu] },
  { code: "pr", patterns: [/(?:^|\s|[.,;])(pr[aá]ca|prace|zamestnanie|brig[aá]da|brigada|h[lľ]ad[aá]m pr[aá]cu|vodi[cč] c\+e|vodic|upratova[cč]ka|oper[aá]tor)(?:$|\s|[.,;])/iu] },
  { code: "mc", patterns: [/(?:^|\s|[.,;])(motorka|motocykel|sk[uú]ter|skuter|[sš]tvorkolka|ctyrkolka|yamaha|honda|kawasaki|suzuki|ktm|helma|prilba)(?:$|\s|[.,;])/iu] },
  { code: "os", patterns: [/(?:^|\s|[.,;])(hodinky|watch|garmin|rolex|casio|seiko|zberate[lľ]|zberatel|mince|staro[zž]itnos[tť]|[sš]perk)(?:$|\s|[.,;])/iu] },
];

export function localMistralClassifier(text: string): MistralParsedWatch {
  let category = "mo";
  for (const item of CATEGORY_MAP) {
    if (item.patterns.some((p) => p.test(text))) {
      category = item.code;
      break;
    }
  }

  // Detekcia cien (vyhýba sa 'Pro Max 256gb')
  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  const maxMatch = text.match(/(?:\bdo\b|\bpod\b|\bmaximáln[eě]\b|\bmaximalne\b|\bmax\s*cena\b|\bmax\s*:)\s*(\d[\d\s]*)(?:\s*(?:€|eur|euro|kč|czk|kc))?/i);
  if (maxMatch) {
    maxPrice = parseInt(maxMatch[1].replace(/\s/g, ""), 10);
  }

  const minMatch = text.match(/(?:\bod\b|\bnad\b|\bminimáln[eě]\b|\bminimalne\b|\bmin\s*cena\b|\bmin\s*:)\s*(\d[\d\s]*)(?:\s*(?:€|eur|euro|kč|czk|kc))?/i);
  if (minMatch) {
    minPrice = parseInt(minMatch[1].replace(/\s/g, ""), 10);
  }

  // Detekcia krajiny
  const lower = text.toLowerCase();
  const hasCz = /(?:^|\s|[.,;])(cz|čr|cr|česko|cesko|čechy|cechy|v čr|v cr|prah[ayueo]|praze|brn[oeěa]|ostrav[aeyu]|plzeň|plzni|olomouc|olomouci|kč|czk)(?:$|\s|[.,;])/iu.test(lower);
  const hasSk = /(?:^|\s|[.,;])(sk|sr|slovensko|bratislav[ayueo]|košic[eai]|kosic[eai]|žilin[ayueo]|zilin[ayueo]|nitr[ayueo]|trnav[ayueo]|eur|€)(?:$|\s|[.,;])/iu.test(lower);

  let countries: Array<"SK" | "CZ"> = ["SK", "CZ"];
  if (hasCz && !hasSk) countries = ["CZ"];
  if (hasSk && !hasCz) countries = ["SK"];

  // Kľúčové slová bez stop slov
  const stopWords = new Set(["a", "aj", "v", "vo", "ve", "na", "do", "od", "pod", "max", "min", "eur", "€", "kč", "czk", "sk", "cz", "hľadám", "hladam", "kupim", "kúpim", "lacno", "top"]);
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopWords.has(t));

  const name = text.length > 40 ? `${text.slice(0, 37).trim()}…` : text;

  return {
    name,
    category,
    keywords: [...new Set(tokens)].slice(0, 5),
    minPrice,
    maxPrice,
    countries,
  };
}
