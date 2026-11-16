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
| Projectdetail | Velden uit de export: omschrijving, team, verantwoordelijke, doorlooptijd, teamplan, betrokken teams, impact op team |
| Teams | Lopende activiteiten per team per kwartaal, activiteiten per verantwoordelijke |

## Data
`mockup/data.js` bevat 50 diverse activiteiten uit de export *Lopende projecten / reguliere taken* (16-11-2026),
gegenereerd met `tools/export_naar_mockup.py`:

```
python tools/export_naar_mockup.py pad/naar/export.xlsx            # namen gepseudonimiseerd (standaard)
python tools/export_naar_mockup.py pad/naar/export.xlsx --echte-namen
```

- De ingelogde gebruiker "Jan Janssen" krijgt de activiteiten van de medewerker met de meeste verantwoordelijkheden in de export.
- Namen van medewerkers zijn standaard gepseudonimiseerd; projectnamen, teams, programma's, datums en teamplanvelden komen uit de export.
- Niet in de export en daarom als voorbeelddata aangevuld: *gezondheid*, *projectleden* en *recente updates*. "Doorlooptijd" is berekend uit start- en einddatum.
- De export zelf (`*.xlsx`) wordt niet in de repository opgeslagen.

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
