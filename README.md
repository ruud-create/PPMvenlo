# PPM Venlo – mockup projectenportaal

Klikbare mockup van een Project Portfolio Management-app voor medewerkers van gemeente Venlo.
Primair ontworpen voor **mobiel gebruik** (navigatiebalk onderin, kaarten in plaats van tabellen); op desktop schaalt de app op naar een zijbalk met tabellen.

## Schermen
| Scherm | Doel |
|---|---|
| Dashboard | KPI's, statusverdeling portfolio, projecten die aandacht vragen, komende mijlpalen, budget per programma |
| Projecten | Filterbare lijst met status, voortgang, budget en einddatum |
| Projectdetail | Status op tijd/geld/scope/kwaliteit/risico, planning (gantt), financiën, risico's, updates, mijlpalen, team |
| Resources | Bezettings-heatmap per medewerker (8 weken), bezetting per team, signalen over- en onderbezetting |

Screenshots: mobiel in `docs/screenshots/mobiel/` (`overzicht.png` toont alle vier de schermen naast elkaar), desktop in `docs/screenshots/`.

## Bekijken
Open `mockup/index.html` in een browser. Er is geen build of server nodig.
Voor de mobiele weergave: open de ontwikkelaarstools van de browser en kies een telefoonformaat, of maak het venster smaller dan 760px.

## Huisstijl
Gebaseerd op de huisstijl van gemeente Venlo:
- **Logo**: `mockup/assets/` bevat het logo (wit en blauwgroen, transparante achtergrond), los beeldmerk (V) en woordmerk.
- **Primaire kleur**: Venlo blauwgroen `#00807F` (PMS 7474 C) met tinten 150% `#005D5C`, 125% `#016D6D`, 75% `#40A09F`, 50% `#7FBFBF`, 25% `#BFDFDF`, 10% `#E0F5F4`.
- **Contrastregel**: witte tekst alleen op 100% en 150%; donkere tekst op 50% en lichter.
- **Secundaire kleuren** functioneel ingezet: groen = op koers, bruin = aandacht, rood = kritiek, blauw = informatief, roze = markering "vandaag" in de planning.

Alle kleuren staan als tokens bovenaan `mockup/styles.css`. Alle data in `mockup/data.js` is fictief.
