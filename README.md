# PPM Venlo – mockup projectenportaal

Klikbare mockup van een Project Portfolio Management-app voor medewerkers van gemeente Venlo.
Primair ontworpen voor **mobiel gebruik** (navigatiebalk onderin, kaarten in plaats van tabellen); op desktop schaalt de app op naar een zijbalk met tabellen.

## Schermen
| Scherm | Doel |
|---|---|
| Inloggen | Microsoft SSO (mockup; koppeling met Entra ID volgt later) |
| Mijn overzicht | Landingspagina: activiteiten waar ik **verantwoordelijk** voor ben en waarin ik **actief** ben, einddata en signalen |
| Portfolio | Gezondheid, aandachtspunten, einddata, verdeling per programma / categorie teamplan / betrokken teams |
| Projecten & taken | Filterbare lijst (mijn, actief in, aandacht, projecten, reguliere taken, programma, team, zoeken) |
| Projectdetail | Velden uit de export, strategische weging, inzet in uren dit kwartaal en **statusupdates toevoegen** (datum, update-tekst, status aanpassen) |
| Teams & uren | Begrote uren per medewerker per kwartaal (bezetting t.o.v. norm), lopende activiteiten per team, activiteiten per verantwoordelijke |

## Data
`mockup/data.js` bevat 50 diverse activiteiten uit de export *Lopende projecten / reguliere taken* (16-11-2026),
gegenereerd met `tools/export_naar_mockup.py`:

```
python tools/export_naar_mockup.py projecten.xlsx --uren uren.xlsx                 # namen gepseudonimiseerd (standaard)
python tools/export_naar_mockup.py projecten.xlsx --uren uren.xlsx --echte-namen
```

- `--uren`: export *Uren medewerkers* (begrote uren per medewerker per activiteit per periode). Uren worden naar rato
  van het aantal dagen over de kwartalen K1 2025 – K4 2026 verdeeld en gekoppeld aan activiteiten op naam.
  Bezetting = uren / norm van 375 u per kwartaal (36 u/week × 13 weken × ~80% productief; aanname, aan te passen in het script).
- Dezelfde pseudonimisering geldt voor beide exports: een medewerker krijgt overal dezelfde verzonnen naam.

- De ingelogde gebruiker "Ruud Janssen" krijgt de activiteiten van de medewerker met de meeste verantwoordelijkheden in de export.
- Namen van medewerkers zijn standaard gepseudonimiseerd; projectnamen, teams, programma's, datums en teamplanvelden komen uit de export.
- Niet in de export en daarom als voorbeelddata aangevuld: *gezondheid*, *strategische weging* (complexiteit, uitvoerbaarheid, strategische waarde), *projectleden* en *recente updates*. "Doorlooptijd" is berekend uit start- en einddatum.
- Statusupdates die je in de mockup toevoegt worden alleen in je eigen browser bewaard (localStorage).
- De exports zelf (`*.xlsx`) worden niet in de repository opgeslagen.

## Bekijken
Open `mockup/index.html` in een browser; je start op het inlogscherm (klik op *Inloggen met Microsoft*). Er is geen build of server nodig.
Voor de mobiele weergave: open de ontwikkelaarstools van de browser en kies een telefoonformaat, of maak het venster smaller dan 760px.

## Huisstijl
Gebaseerd op de huisstijl van gemeente Venlo:
- **Logo**: `mockup/assets/` bevat het logo (wit en blauwgroen, transparante achtergrond), los beeldmerk (V) en woordmerk.
- **Primaire kleur**: Venlo blauwgroen `#00807F` (PMS 7474 C) met tinten 150% `#005D5C`, 125% `#016D6D`, 75% `#40A09F`, 50% `#7FBFBF`, 25% `#BFDFDF`, 10% `#E0F5F4`.
- **Contrastregel**: witte tekst alleen op 100% en 150%; donkere tekst op 50% en lichter.
- **Secundaire kleuren** functioneel ingezet: groen = op koers, bruin = aandacht, rood = kritiek, blauw = informatief, roze = markering "vandaag" in de planning.

Alle kleuren staan als tokens bovenaan `mockup/styles.css`. Alle data in `mockup/data.js` is fictief.
