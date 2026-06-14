# Bevægelsesuge — webapp spec

En lille familie-webapp til at registrere fritidsbevægelse. Bærende idé: alt skal føles som noget der **fyldes op**, ikke en saldo der tælles ned (modsætningen til skærmtid). Den primære output-flade er en uge-grid, og der skal være en **printvenlig version** til køleskabet.

## 1. Formål og designprincip

- Hver person sætter sit eget daglige mål i minutter (fx 15 for et yngre barn, 30 for et ældre).
- En "cirkel" fyldes når man har bevæget sig sit antal minutter **i ét sammenhængende stræk**.
- Skole- og SFO-tid tæller **ikke** med — kun fritid.
- Bevægelse lavet **sammen** markeres med en stjerne (bonus, ikke krav).
- Succes måles på et **ugemål** (antal cirkler over ugen), ikke dagligt — fjerner det daglige pres.

Designkonsekvens: fremgang skal være visuelt additiv (cirkler fyldes, evt. mikro-animation ved udfyldning). Ingen nedtælling, ingen "tid tilbage", ingen røde mangel-tilstande.

## 2. Funktionelle krav

**Familie & medlemmer**

- Opret/rediger/slet medlemmer (navn, daglig måltid i minutter, farve, sortering).
- Min. 1, realistisk 2–6 medlemmer.

**Ugevisning (kerne)**

- Grid: rækker = medlemmer, kolonner = ugedage (man–søn, ISO-uge).
- Naviger mellem uger (forrige/næste/denne uge).
- Pr. celle: toggle "udfyldt" (cirkel), valgfri fritekst "hvad?", toggle "sammen" (stjerne).
- Live opsummering pr. medlem (antal cirkler i ugen) og pr. familie.

**Ugemål & belønning**

- Fritekst-mål for ugen + valgfrit måltal (antal cirkler).
- Fritekst-belønning.
- Visuel indikation når et medlem / familien har nået måltallet.

**Print**

- Knap "Print denne uge".
- To tilstande: **udfyldt** (nuværende state) eller **blank** (tomme cirkler til udfyldning i hånden).

**Persistens**

- State overlever genindlæsning. Ingen login-krav i v1.

## 3. Datamodel

```
Family {
  id: string
  name?: string
  members: Member[]
}

Member {
  id: string
  name: string
  dailyTargetMinutes: number   // fx 15, 30
  color: string                // hex, til cirkel/række
  order: number
}

WeekGoal {
  weekKey: string              // "2026-W24"
  description?: string
  reward?: string
  targetCircles?: number
}

Entry {
  id: string
  memberId: string
  date: string                 // ISO yyyy-mm-dd
  completed: boolean           // cirkel fyldt
  activity?: string            // "hvad?"
  together: boolean            // stjerne
}
```

`weekKey` udledes af dato (ISO 8601 uge). Entries lagres flade og filtreres pr. uge/medlem i UI'et — gør historik og streaks gratis senere.

## 4. Skærme / UI

1. **Uge-grid** (primær) — som beskrevet, med uge-navigator i toppen og ugemål/belønning i bunden.
2. **Medlemmer** (settings/drawer) — administrer navne, mål, farver.
3. **Print-view** — render-only af aktuel uge i A4-landskab, styret af `@media print` eller en dedikeret route (`/print/:weekKey?mode=filled|blank`).

Interaktion på celle: tap/klik = toggle cirkel. Long-press / sekundær handling = åbn lille popover med "hvad?" + "sammen". Hold det let — det skal kunne betjenes af et barn på en tablet.

## 5. Print-versionen (eksplicit)

Krav:

- **A4 landskab**, `@page { size: A4 landscape; margin: 10mm; }`.
- Skjul al navigation, knapper og redigeringskontroller (`.no-print`).
- Vis: titel, ugenummer, regel-linje (min. i træk · ikke skole/SFO), grid, ugemål, signaturforklaring (cirkel = mål nået, stjerne = sammen).
- **filled mode**: fyldte cirkler farves med medlemmets farve; stjerner vises; "hvad?" som lille tekst.
- **blank mode**: tomme cirkler med outline, plads til at skrive "hvad?" i hånden, tomme stjerner.
- Sort/hvid-venlig: brug outline + udfyldning der også giver mening i gråtoner; undlad at gøre information afhængig af farve alene.
- Respektér sideskift: hele grid'et på én side ved op til ~6 rækker.

En statisk HTML-prototype af præcis dette layout findes allerede (samme visuelle sprog) og kan bruges som reference for print-CSS'en.

## 6. Tekniske valg

Det er bevidst en lille app — vælg det letteste der giver en installérbar PWA til en køleskabs-tablet:

| Mulighed                      | Hvornår                                                                     |
| ----------------------------- | --------------------------------------------------------------------------- |
| **Blazor WASM (PWA)**         | Naturligt hvis du vil holde dig i .NET-økosystemet; god offline-PWA-støtte. |
| **React + Vite (PWA)**        | Mindst friktion for en SPA, stort økosystem til print/PDF hvis nødvendigt.  |
| **Statisk HTML + Alpine/lit** | Hvis du vil have nul build og bare hoste én fil på homelab'en.              |

**Persistens v1:** `localStorage` eller IndexedDB (client-only). Ingen backend nødvendig.
**Persistens v2 (valgfrit):** lille API + delt state mellem enheder — kan ramme din homelab (Docker/Cosmos) hvis flere skal redigere fra hver sin enhed.

**PWA:** manifest + service worker, så den kan "installeres" på en gammel tablet på køkkenbordet og virke offline.

## 7. Ikke-funktionelle krav

- Responsivt fra ~360px (telefon) op til tablet/desktop.
- Tilgængelighed: tastatur-fokus synligt, cirkel-toggle har label, farve er aldrig eneste informationsbærer.
- `prefers-reduced-motion` respekteres (drop udfyldnings-animation).
- Ingen ekstern tracking; data bliver på enheden i v1.

## 8. Nice-to-haves (ikke v1)

- Streaks / historik på tværs af uger (datamodellen understøtter det allerede).
- Ugentlig auto-nulstilling med arkivering.
- "Sammen"-statistik (hvor mange stjerner pr. uge).
- Eksport til PDF direkte (frem for browser-print).
- Lille fejring når ugemål nås (konfetti/lyd — med reduced-motion-respekt).

## 9. Acceptkriterier (v1)

- [ ] Kan oprette medlemmer med individuelt minutmål.
- [ ] Kan navigere mellem uger og se korrekt ISO-uge.
- [ ] Kan toggle cirkel, sætte "hvad?" og "sammen" pr. celle.
- [ ] Opsummering pr. medlem og familie opdateres live.
- [ ] Ugemål + belønning kan sættes og vises som nået/ikke nået.
- [ ] State overlever genindlæsning.
- [ ] Print giver et rent A4-landskab uden UI-kontroller, i både filled og blank mode.
- [ ] Brugbar med tastatur og i gråtoner.
