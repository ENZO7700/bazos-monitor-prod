/**
 * Kalkulátor vzdialenosti od centra Prahy (Václavské náměstí) a odhad ceny Bolt taxíka.
 * Referenčný bod: Václavské náměstí, Praha 1 (50.0813° N, 14.4267° E).
 */

export interface VaclavakDistanceResult {
  km: number;
  formattedDistance: string;
  locationName: string;
  bolt: {
    priceCzk: number;
    formattedPrice: string;
    boltUrl: string;
  };
}

// Cenník Bolt Praha (štandardná kategória Bolt)
export const BOLT_BASE_FARE = 45; // Nástup v Kč
export const BOLT_KM_RATE = 17; // Kč / km
export const BOLT_MIN_FARE = 80; // Minimálne jazdné v Kč
export const BOLT_TIME_RATE_PER_KM = 9; // ~2 min/km po 4.50 Kč/min v pražskej premávke

/**
 * Databáza vzdialeností z Václavského námestia (v km cestnou trasou).
 */
const PRAHA_DISTANCES: Record<string, { km: number; name: string }> = {
  // Praha 1 (Centrum)
  "praha 1": { km: 0.5, name: "Praha 1 (Centrum)" },
  "stare mesto": { km: 0.7, name: "Staré Město" },
  "staré město": { km: 0.7, name: "Staré Město" },
  "nove mesto": { km: 0.4, name: "Nové Město" },
  "nové město": { km: 0.4, name: "Nové Město" },
  "mala strana": { km: 1.8, name: "Malá Strana" },
  "malá strana": { km: 1.8, name: "Malá Strana" },
  "hradcany": { km: 2.5, name: "Hradčany" },
  "hradčany": { km: 2.5, name: "Hradčany" },
  "josefov": { km: 1.0, name: "Josefov" },
  "vaclavak": { km: 0.1, name: "Václavské náměstí" },
  "václavák": { km: 0.1, name: "Václavské náměstí" },

  // Praha 2 (Vinohrady, Vyšehrad, Nusle)
  "praha 2": { km: 1.5, name: "Praha 2 (Vinohrady)" },
  "vinohrady": { km: 1.6, name: "Vinohrady" },
  "vysehrad": { km: 2.5, name: "Vyšehrad" },
  "vyšehrad": { km: 2.5, name: "Vyšehrad" },
  "namesti miru": { km: 1.2, name: "Náměstí Míru" },
  "náměstí míru": { km: 1.2, name: "Náměstí Míru" },

  // Praha 3 (Žižkov)
  "praha 3": { km: 2.4, name: "Praha 3 (Žižkov)" },
  "zizkov": { km: 2.4, name: "Žižkov" },
  "žižkov": { km: 2.4, name: "Žižkov" },
  "flora": { km: 2.6, name: "Flora" },
  "jarov": { km: 4.8, name: "Jarov" },

  // Praha 4 (Nusle, Michle, Krč, Braník, Podolí, Chodov, Háje)
  "praha 4": { km: 5.5, name: "Praha 4" },
  "nusle": { km: 2.8, name: "Nusle" },
  "pankrac": { km: 3.8, name: "Pankrác" },
  "pankrác": { km: 3.8, name: "Pankrác" },
  "budejovicka": { km: 4.5, name: "Budějovická" },
  "budějovická": { km: 4.5, name: "Budějovická" },
  "michle": { km: 4.8, name: "Michle" },
  "krc": { km: 6.2, name: "Krč" },
  "krč": { km: 6.2, name: "Krč" },
  "branik": { km: 6.8, name: "Braník" },
  "braník": { km: 6.8, name: "Braník" },
  "podoli": { km: 4.2, name: "Podolí" },
  "podolí": { km: 4.2, name: "Podolí" },
  "chodov": { km: 9.2, name: "Chodov" },
  "haje": { km: 11.5, name: "Háje" },
  "háje": { km: 11.5, name: "Háje" },
  "modrany": { km: 10.5, name: "Modřany" },
  "modřany": { km: 10.5, name: "Modřany" },
  "kunratice": { km: 10.0, name: "Kunratice" },
  "libus": { km: 10.8, name: "Libuš" },
  "libuš": { km: 10.8, name: "Libuš" },
  "seberov": { km: 12.0, name: "Šeberov" },

  // Praha 5 (Smíchov, Košíře, Motol, Jinonice, Stodůlky, Zličín)
  "praha 5": { km: 3.8, name: "Praha 5 (Smíchov)" },
  "smichov": { km: 2.8, name: "Smíchov" },
  "smíchov": { km: 2.8, name: "Smíchov" },
  "andel": { km: 2.5, name: "Anděl" },
  "anděl": { km: 2.5, name: "Anděl" },
  "kosire": { km: 4.8, name: "Košíře" },
  "košíře": { km: 4.8, name: "Košíře" },
  "motol": { km: 7.2, name: "Motol" },
  "jinonice": { km: 6.5, name: "Jinonice" },
  "radlice": { km: 4.5, name: "Radlice" },
  "barrandov": { km: 7.8, name: "Barrandov" },
  "hlubocepy": { km: 6.8, name: "Hlubočepy" },
  "stodulky": { km: 9.5, name: "Stodůlky" },
  "stodůlky": { km: 9.5, name: "Stodůlky" },
  "zlicin": { km: 12.5, name: "Zličín" },
  "zličín": { km: 12.5, name: "Zličín" },

  // Praha 6 (Dejvice, Bubeneč, Břevnov, Vokovice, Ruzyně, Řepy)
  "praha 6": { km: 4.8, name: "Praha 6 (Dejvice)" },
  "dejvice": { km: 4.0, name: "Dejvice" },
  "bubenec": { km: 3.5, name: "Bubeneč" },
  "bubeneč": { km: 3.5, name: "Bubeneč" },
  "brevnov": { km: 4.8, name: "Břevnov" },
  "břevnov": { km: 4.8, name: "Břevnov" },
  "stresovice": { km: 4.2, name: "Střešovice" },
  "střešovice": { km: 4.2, name: "Střešovice" },
  "vokovice": { km: 6.8, name: "Vokovice" },
  "veleslavin": { km: 6.2, name: "Veleslavín" },
  "veleslavín": { km: 6.2, name: "Veleslavín" },
  "ruzyne": { km: 10.5, name: "Ruzyně" },
  "ruzyně": { km: 10.5, name: "Ruzyně" },
  "repy": { km: 8.8, name: "Řepy" },
  "řepy": { km: 8.8, name: "Řepy" },
  "suchdol": { km: 8.5, name: "Suchdol" },
  "sedlec": { km: 7.2, name: "Sedlec" },

  // Praha 7 (Holešovice, Letná, Troja)
  "praha 7": { km: 2.8, name: "Praha 7 (Holešovice)" },
  "holesovice": { km: 3.0, name: "Holešovice" },
  "holešovice": { km: 3.0, name: "Holešovice" },
  "letna": { km: 2.2, name: "Letná" },
  "letná": { km: 2.2, name: "Letná" },
  "troja": { km: 5.2, name: "Troja" },
  "trója": { km: 5.2, name: "Troja" },

  // Praha 8 (Karlín, Libeň, Kobylisy, Bohnice, Ďáblice)
  "praha 8": { km: 3.2, name: "Praha 8 (Karlín)" },
  "karlin": { km: 2.0, name: "Karlín" },
  "karlín": { km: 2.0, name: "Karlín" },
  "liben": { km: 4.5, name: "Libeň" },
  "libeň": { km: 4.5, name: "Libeň" },
  "palmovka": { km: 4.2, name: "Palmovka" },
  "kobylisy": { km: 6.2, name: "Kobylisy" },
  "bohnice": { km: 8.5, name: "Bohnice" },
  "cimice": { km: 9.0, name: "Čimice" },
  "čimice": { km: 9.0, name: "Čimice" },
  "dablice": { km: 8.8, name: "Ďáblice" },
  "ďáblice": { km: 8.8, name: "Ďáblice" },

  // Praha 9 (Vysočany, Prosek, Hloubětín, Letňany, Čakovice)
  "praha 9": { km: 6.5, name: "Praha 9 (Vysočany)" },
  "vysocany": { km: 6.0, name: "Vysočany" },
  "vysočany": { km: 6.0, name: "Vysočany" },
  "prosek": { km: 6.8, name: "Prosek" },
  "hloubetin": { km: 8.5, name: "Hloubětín" },
  "hloubětín": { km: 8.5, name: "Hloubětín" },
  "letnany": { km: 9.5, name: "Letňany" },
  "letňany": { km: 9.5, name: "Letňany" },
  "kbely": { km: 11.5, name: "Kbely" },
  "cakovice": { km: 11.0, name: "Čakovice" },
  "čakovice": { km: 11.0, name: "Čakovice" },

  // Praha 10 (Vršovice, Strašnice, Malešice, Záběhlice, Hostivař)
  "praha 10": { km: 3.5, name: "Praha 10 (Vršovice)" },
  "vrsovice": { km: 2.8, name: "Vršovice" },
  "vršovice": { km: 2.8, name: "Vršovice" },
  "strasnice": { km: 4.8, name: "Strašnice" },
  "strašnice": { km: 4.8, name: "Strašnice" },
  "malesice": { km: 5.8, name: "Malešice" },
  "malešice": { km: 5.8, name: "Malešice" },
  "zabehlice": { km: 5.5, name: "Záběhlice" },
  "záběhlice": { km: 5.5, name: "Záběhlice" },
  "hostivar": { km: 8.2, name: "Hostivař" },
  "hostivař": { km: 8.2, name: "Hostivař" },
  "sterboholy": { km: 9.8, name: "Štěrboholy" },
  "štěrboholy": { km: 9.8, name: "Štěrboholy" },

  // Ostatné mestské časti Praha 11 - 22
  "praha 11": { km: 9.5, name: "Praha 11 (Chodov)" },
  "praha 12": { km: 10.5, name: "Praha 12 (Modřany)" },
  "praha 13": { km: 9.8, name: "Praha 13 (Stodůlky)" },
  "praha 14": { km: 11.0, name: "Praha 14 (Černý Most)" },
  "cerny most": { km: 12.5, name: "Černý Most" },
  "černý most": { km: 12.5, name: "Černý Most" },
  "praha 15": { km: 9.5, name: "Praha 15 (Hostivař)" },
  "praha 16": { km: 14.5, name: "Praha 16 (Radotín)" },
  "radotin": { km: 14.5, name: "Radotín" },
  "radotín": { km: 14.5, name: "Radotín" },
  "praha 17": { km: 10.0, name: "Praha 17 (Řepy)" },
  "praha 18": { km: 9.5, name: "Praha 18 (Letňany)" },
  "praha 19": { km: 11.5, name: "Praha 19 (Kbely)" },
  "praha 20": { km: 14.0, name: "Praha 20 (Horní Počernice)" },
  "pocernice": { km: 14.0, name: "Horní Počernice" },
  "počernice": { km: 14.0, name: "Horní Počernice" },
  "praha 21": { km: 16.5, name: "Praha 21 (Újezd n. Lesy)" },
  "praha 22": { km: 15.0, name: "Praha 22 (Uhříněves)" },
  "uhrineves": { km: 15.0, name: "Uhříněves" },
  "uhříněves": { km: 15.0, name: "Uhříněves" },
  "zbraslav": { km: 13.5, name: "Zbraslav" },

  // Mestá v Stredočeskom kraji (vzdialenosť do Prahy)
  "kladno": { km: 31, name: "Kladno" },
  "beroun": { km: 34, name: "Beroun" },
  "ricany": { km: 22, name: "Říčany" },
  "říčany": { km: 22, name: "Říčany" },
  "brandys": { km: 24, name: "Brandýs n. Labem" },
  "brandýs": { km: 24, name: "Brandýs n. Labem" },
  "celakovice": { km: 28, name: "Čelákovice" },
  "čelákovice": { km: 28, name: "Čelákovice" },
  "melnik": { km: 36, name: "Mělník" },
  "mělník": { km: 36, name: "Mělník" },
  "kralupy": { km: 26, name: "Kralupy n. Vltavou" },
  "neratovice": { km: 24, name: "Neratovice" },
  "slany": { km: 34, name: "Slaný" },
  "slaný": { km: 34, name: "Slaný" },
  "kolin": { km: 62, name: "Kolín" },
  "kolín": { km: 62, name: "Kolín" },
  "kutna hora": { km: 72, name: "Kutná Hora" },
  "kutná hora": { km: 72, name: "Kutná Hora" },
  "mlada boleslav": { km: 58, name: "Mladá Boleslav" },
  "mladá boleslav": { km: 58, name: "Mladá Boleslav" },
  "pribram": { km: 62, name: "Příbram" },
  "příbram": { km: 62, name: "Příbram" },
  "benesov": { km: 46, name: "Benešov" },
  "benešov": { km: 46, name: "Benešov" },
  "nymburk": { km: 52, name: "Nymburk" },
  "podebrady": { km: 54, name: "Poděbrady" },
  "poděbrady": { km: 54, name: "Poděbrady" },

  // Ostatné krajské a väčšie mestá ČR
  "plzen": { km: 92, name: "Plzeň" },
  "plzeň": { km: 92, name: "Plzeň" },
  "brno": { km: 206, name: "Brno" },
  "ostrava": { km: 372, name: "Ostrava" },
  "liberec": { km: 104, name: "Liberec" },
  "olomouc": { km: 282, name: "Olomouc" },
  "ceske budejovice": { km: 148, name: "České Budějovice" },
  "české budějovice": { km: 148, name: "České Budějovice" },
  "hradec kralove": { km: 114, name: "Hradec Králové" },
  "hradec králové": { km: 114, name: "Hradec Králové" },
  "pardubice": { km: 122, name: "Pardubice" },
  "usti nad labem": { km: 88, name: "Ústí nad Labem" },
  "ústí nad labem": { km: 88, name: "Ústí nad Labem" },
  "karlovy vary": { km: 126, name: "Karlovy Vary" },
  "zlin": { km: 302, name: "Zlín" },
  "zlín": { km: 302, name: "Zlín" },
  "jihlava": { km: 132, name: "Jihlava" },
};

/**
 * Odhad ceny Bolt taxíka v Prahe a okolí.
 */
export function estimateBoltPrice(km: number): {
  priceCzk: number;
  formattedPrice: string;
  boltUrl: string;
} {
  // Vzorec: Nástup (45 Kč) + km sadzba (17 Kč/km) + odhad času v premávke (9 Kč/km)
  const rawFare = BOLT_BASE_FARE + (km * (BOLT_KM_RATE + BOLT_TIME_RATE_PER_KM));
  const priceCzk = Math.max(BOLT_MIN_FARE, Math.round(rawFare));

  return {
    priceCzk,
    formattedPrice: `~${priceCzk.toLocaleString("cs-CZ")} Kč`,
    boltUrl: "https://bolt.eu/",
  };
}

/**
 * Vypočíta vzdialenosť lokality od Václavského námestia a vráti odhad ceny Bolt taxíka.
 */
export function calculateDistanceFromVaclavak(
  locationString?: string | null
): VaclavakDistanceResult | null {
  if (!locationString || typeof locationString !== "string") return null;

  const normalized = locationString
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Odstránenie diakritiky
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return null;

  // 1. Skontroluj kľúčové slová - konkrétne štvrte (Chodov, Staré Město, Vinohrady) majú prednosť pred všeobecným "Praha 4"
  const sortedEntries = Object.entries(PRAHA_DISTANCES).sort((a, b) => {
    const aIsGenericDistrict = /^praha \d+$/i.test(a[0]);
    const bIsGenericDistrict = /^praha \d+$/i.test(b[0]);
    if (aIsGenericDistrict !== bIsGenericDistrict) {
      return aIsGenericDistrict ? 1 : -1; // Ne-generické štvrte majú prednosť
    }
    return b[0].length - a[0].length;
  });

  for (const [key, val] of sortedEntries) {
    const keyNorm = key
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Regex s hranicou slov
    const regex = new RegExp(`\\b${keyNorm}\\b`, "i");
    if (regex.test(normalized)) {
      const bolt = estimateBoltPrice(val.km);
      const formattedDistance =
        val.km < 1
          ? `${Math.round(val.km * 1000)} m od Václaváku`
          : `${val.km.toFixed(1).replace(".0", "")} km od Václaváku`;

      return {
        km: val.km,
        formattedDistance,
        locationName: val.name,
        bolt,
      };
    }
  }

  // 2. Skontroluj pražské PSČ (100 00 - 199 00)
  const pscMatch = locationString.match(/\b1([0-9]{2})\s*([0-9]{2})\b/);
  if (pscMatch) {
    const districtNum = parseInt(pscMatch[1], 10);
    // Približná vzdialenosť podľa čísla obvodu (Praha 1=10x, Praha 2=12x, Praha 4=14x...)
    const mainDistrict = Math.min(22, Math.max(1, Math.floor(districtNum / 10)));
    const estimatedKm = mainDistrict <= 1 ? 0.8 : mainDistrict <= 3 ? 2.5 : mainDistrict * 1.3;
    const bolt = estimateBoltPrice(estimatedKm);

    return {
      km: estimatedKm,
      formattedDistance: `${estimatedKm.toFixed(1)} km od Václaváku`,
      locationName: `Praha ${mainDistrict}`,
      bolt,
    };
  }

  // 3. Ak obsahuje len všeobecné "Praha"
  if (normalized.includes("praha")) {
    const defaultKm = 3.5;
    const bolt = estimateBoltPrice(defaultKm);
    return {
      km: defaultKm,
      formattedDistance: "3.5 km od Václaváku",
      locationName: "Praha",
      bolt,
    };
  }

  return null;
}
