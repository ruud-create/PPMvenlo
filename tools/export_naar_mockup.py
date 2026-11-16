"""Zet een export 'Lopende projecten / reguliere taken' (xlsx) om naar mockup/data.js.

Gebruik:
    python tools/export_naar_mockup.py <pad-naar-export.xlsx> [--echte-namen]

- Selecteert 50 diverse activiteiten (mix van teams, programma's, projecten en reguliere taken).
- Namen van medewerkers worden standaard gepseudonimiseerd (AVG). Met --echte-namen blijven ze staan;
  gebruik dat alleen als de repository en de mockup intern blijven.
- Velden die niet in de export zitten (gezondheid, projectleden, updates) worden als
  'mockup-aanvulling' gegenereerd en zijn in de app als zodanig herkenbaar.
"""
import datetime as dt
import hashlib
import json
import random
import sys
from collections import Counter, defaultdict

import openpyxl

PEILDATUM = dt.date(2026, 11, 16)
AANTAL = 50
PERSONA_TEAM = "Informatiemanagement (RGIMAN)"

VOORNAMEN = ["Anouk", "Bas", "Tom", "Lisa", "Fatima", "Mark", "Sanne", "Kevin", "Eva", "Ruben", "Iris", "Joost",
             "Maud", "Luuk", "Noor", "Stijn", "Femke", "Daan", "Lotte", "Thijs", "Mila", "Bram", "Esther", "Koen",
             "Yara", "Niels", "Sophie", "Wouter", "Lieke", "Gijs", "Rianne", "Pieter", "Hanneke", "Sem", "Ilse",
             "Martijn", "Floor", "Jesse", "Kim", "Roel"]
ACHTERNAMEN = ["Peeters", "Hendriks", "Verheijen", "Janssen", "El Amrani", "Smeets", "Willems", "Driessen", "Coenen",
               "Hermans", "Linders", "Lemmen", "Kessels", "Thijssen", "Vossen", "Jacobs", "Mulders", "Gommans",
               "Hoeijmakers", "Bouten", "Craenmehr", "Wijnen", "Moonen", "Rutten", "Schreurs", "Vermeulen", "Arts",
               "Martens", "Dings", "Seegers", "Timmermans", "Haenen", "Bartels", "Cox", "Nelissen", "Loonen",
               "Wolters", "Bastiaans", "Verstappen", "Claessens"]


def h(s):
    return int(hashlib.md5(str(s).encode()).hexdigest(), 16)


def datum(s):
    if isinstance(s, (dt.date, dt.datetime)):
        return s.date() if isinstance(s, dt.datetime) else s
    d, m, y = (int(x) for x in s.split("-"))
    return dt.date(y, m, d)


def teams(s):
    if not s:
        return []
    return [t.strip() for t in str(s).split("),") if t.strip()]


def fix_team(t):
    t = t.strip()
    return t if t.endswith(")") else t + ")"


def main(pad, echte_namen=False):
    wb = openpyxl.load_workbook(pad, read_only=True, data_only=True)
    rows = list(wb.active.iter_rows(values_only=True))
    kop, data = rows[0], rows[1:]
    recs = [dict(zip(kop, r)) for r in data]

    # Persona = medewerker met de meeste verantwoordelijkheden (in de mockup: de ingelogde gebruiker)
    persona_echt = Counter(r["Verantwoordelijk"] for r in recs if r["Verantwoordelijk"]).most_common(1)[0][0]

    # ---- pseudonimisering
    namen = {}
    gebruikt = set()

    def pseudo(echt):
        if not echt:
            return None
        if echte_namen:
            return echt
        if echt == persona_echt:
            return "Janssen, Ruud (RJ)"
        if echt not in namen:
            k = h(echt)
            while True:
                v, a = VOORNAMEN[k % len(VOORNAMEN)], ACHTERNAMEN[(k // 7) % len(ACHTERNAMEN)]
                if (v, a) not in gebruikt and a != "Janssen":
                    break
                k += 13
            gebruikt.add((v, a))
            namen[echt] = f"{a}, {v} ({v[0]}{a[0]})"
        return namen[echt]

    # ---- selectie: divers, deterministisch
    rnd = random.Random(42)
    rnd.shuffle(recs)
    gekozen, ids = [], set()

    def neem(lijst, n):
        for r in lijst:
            if n <= 0:
                break
            if r["Id"] in ids:
                continue
            gekozen.append(r)
            ids.add(r["Id"])
            n -= 1

    eigen = [r for r in recs if r["Verantwoordelijk"] == persona_echt]
    neem([r for r in eigen if r["Soort activiteit"] == "Project"], 5)
    neem([r for r in eigen if r["Soort activiteit"] != "Project"], 5)
    actief = [r for r in recs if r["Verantwoordelijk"] != persona_echt and PERSONA_TEAM in (r["Teams Betrokken"] or "")
              and r["Soort activiteit"] == "Project"]
    neem(sorted(actief, key=lambda r: -len(r["Omschrijving"] or "")), 10)
    neem([r for r in recs if datum(r["Einddatum"]) < PEILDATUM], 4)          # over einddatum
    neem([r for r in recs if datum(r["Startdatum"]) > PEILDATUM], 2)          # nog te starten
    # rest: per team round-robin, voorkeur projecten met omschrijving
    per_team = defaultdict(list)
    for r in sorted(recs, key=lambda r: (r["Soort activiteit"] != "Project", not r["Omschrijving"])):
        per_team[r["Team verantwoordelijk"]].append(r)
    while len(gekozen) < AANTAL:
        voor = len(gekozen)
        for t in sorted(per_team, key=lambda t: len(per_team[t])):
            neem(per_team[t], 1)
            if len(gekozen) >= AANTAL:
                break
        if len(gekozen) == voor:
            break

    # ---- omzetten
    out = []
    for r in gekozen:
        start, eind = datum(r["Startdatum"]), datum(r["Einddatum"])
        regulier = r["Soort activiteit"] != "Project"
        totaal = max((eind - start).days, 1)
        verstreken = max(0, min(100, round((PEILDATUM - start).days / totaal * 100)))
        k = h(r["Id"])
        if eind < PEILDATUM:
            gezondheid = "risk"
        elif start > PEILDATUM:
            gezondheid = "plan"
        else:
            gezondheid = ["ok", "ok", "ok", "warn", "ok", "ok", "warn", "ok", "risk", "ok"][k % 10]
        betrokken = [fix_team(t) for t in teams(r["Teams Betrokken"])]
        impact = [fix_team(t) for t in teams(r["Impact Op Team"])]
        verantw = pseudo(r["Verantwoordelijk"])
        # projectleden (mockup-aanvulling): persona zit in projecten waar zijn/haar team betrokken is
        leden = []
        if PERSONA_TEAM in betrokken and r["Verantwoordelijk"] != persona_echt and k % 3 != 0:
            leden.append("Janssen, Ruud (RJ)")
        for i in range(2 + k % 3):
            leden.append(pseudo(f"lid-{(k >> (i * 5)) % 60}"))
        jaren = r["Relevant Voor Jaar Teamplan"]
        # strategische weging (mockup-aanvulling): scores 1-5
        cx = 0.9 + (0 if regulier else 0.6) + min(len(betrokken), 5) * 0.3 + (0.6 if impact else 0) \
            + (0.5 if r["Bedrijfsvoeringsbreedproject"] == "Ja" else 0) + ((k >> 3) % 9) * 0.22
        ux = 4.0 - (1.5 if eind < PEILDATUM else 0) - (1.4 if gezondheid == "risk" else 0.7 if gezondheid == "warn" else 0) \
            - max(len(betrokken) - 2, 0) * 0.25 + ((k >> 7) % 9) * 0.2 - 0.6
        waarde = 2 + (1 if r["Programma"] and r["Programma"] != "Bedrijfsvoering" else 0) \
            + (1 if r["Ontwikkellijn"] else 0) + (1 if (r["Categorieteamplan"] or "").startswith("B") else 0) + (k >> 11) % 2
        weging = {"complexiteit": round(max(1, min(5, cx)), 1),
                  "uitvoerbaarheid": round(max(1, min(5, ux)), 1),
                  "waarde": int(max(1, min(5, waarde)))}
        out.append({
            "id": r["Id"],
            "naam": r["Gecontracteerde activiteit"].strip(),
            "team": fix_team(r["Team verantwoordelijk"] or ""),
            "verantwoordelijk": verantw,
            "status": r["Status"],
            "omschrijving": (r["Omschrijving"] or "").strip(),
            "programma": r["Programma"] or "Geen programma",
            "soort": r["Soort activiteit"],
            "start": start.isoformat(),
            "eind": eind.isoformat(),
            "categorie": r["Categorieteamplan"],
            "ontstaan": r["Ontstaanactiviteit"],
            "inUitvoering": r["In Uitvoering"] == "Ja",
            "ontwikkellijn": r["Ontwikkellijn"],
            "teamplanJaren": [int(x) for x in str(jaren).split(",")] if jaren else [],
            "bvBreed": r["Bedrijfsvoeringsbreedproject"],
            "teamsBetrokken": betrokken,
            "impactOpTeam": impact,
            # mockup-aanvullingen (niet in export)
            "gezondheid": gezondheid,
            "verstreken": None if regulier and (eind - start).days > 5 * 365 else verstreken,
            "leden": list(dict.fromkeys(leden)),
            "weging": weging,
        })

    js = ("// Gegenereerd door tools/export_naar_mockup.py uit de export 'Lopende projecten/reguliere taken'.\n"
          "// Namen zijn gepseudonimiseerd" + (" NIET (--echte-namen)" if echte_namen else "") + ".\n"
          "// Velden 'gezondheid', 'verstreken', 'leden' en 'weging' zijn mockup-aanvullingen.\n"
          "window.PPM = " + json.dumps({
              "peildatum": PEILDATUM.isoformat(),
              "gebruiker": {"naam": "Janssen, Ruud (RJ)", "functie": "Hoofd Informatiemanagement", "team": PERSONA_TEAM},
              "activiteiten": out,
          }, ensure_ascii=False, indent=1) + ";\n")
    with open("mockup/data.js", "w", encoding="utf-8") as f:
        f.write(js)
    c = Counter(a["soort"] for a in out)
    print(f"{len(out)} activiteiten geschreven ({dict(c)}), {len({a['team'] for a in out})} teams, "
          f"{len({a['programma'] for a in out})} programma's")


if __name__ == "__main__":
    main(sys.argv[1], "--echte-namen" in sys.argv)
