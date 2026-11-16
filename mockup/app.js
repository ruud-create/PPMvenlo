(function () {
  const D = window.PPM;
  const view = document.getElementById("view");
  const STATUS = {
    ok: ["ok", "Op koers"],
    warn: ["warn", "Aandacht"],
    risk: ["risk", "Kritiek"],
    done: ["done", "Afronding"],
  };
  const MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const fmtDate = (s) => { const d = new Date(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const eur = (m) => `€ ${m.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mln`;
  const badge = (s) => `<span class="badge ${STATUS[s][0]}">${STATUS[s][1]}</span>`;
  const initials = (n) => n.split(" ").filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join("");
  const progress = (v, cls = "") => `<div class="prog-cell"><div class="progress ${cls}"><span style="width:${v}%"></span></div><span class="num">${v}%</span></div>`;

  /* ------------------------------ Dashboard ------------------------------ */
  function dashboard() {
    const P = D.projects;
    const count = (s) => P.filter((p) => p.status === s).length;
    const budget = P.reduce((a, p) => a + p.budget, 0);
    const spent = P.reduce((a, p) => a + p.besteed, 0);
    const att = P.filter((p) => p.status === "risk" || p.status === "warn");
    const byProg = {};
    P.forEach((p) => { byProg[p.programma] = (byProg[p.programma] || 0) + p.budget; });
    const progs = Object.entries(byProg).sort((a, b) => b[1] - a[1]);
    const maxProg = progs[0][1];
    const avgLoad = Math.round(D.people.reduce((a, p) => a + p.w[0], 0) / D.people.length);
    const seg = [["ok", "var(--ok)"], ["warn", "var(--venlo-warm)"], ["risk", "var(--risk)"], ["done", "#9aa7b8"]];

    return `
      <div class="page-head">
        <div>
          <h1>Goedemorgen, Jan</h1>
          <p>Overzicht van het projectenportfolio van gemeente Venlo</p>
        </div>
        <div class="btn-row"><button class="btn">Exporteer</button><button class="btn primary">+ Nieuw project</button></div>
      </div>

      <div class="grid g-4">
        <div class="card kpi accent"><div class="kpi-label">Actieve projecten</div><div class="kpi-value num">${P.length}</div><div class="kpi-sub"><span class="up">+2</span> t.o.v. vorig kwartaal</div></div>
        <div class="card kpi accent"><div class="kpi-label">Totaal budget</div><div class="kpi-value num">${eur(budget)}</div><div class="kpi-sub">${Math.round((spent / budget) * 100)}% besteed (${eur(spent)})</div></div>
        <div class="card kpi accent"><div class="kpi-label">Op koers</div><div class="kpi-value num">${Math.round(((count("ok") + count("done")) / P.length) * 100)}%</div><div class="kpi-sub"><span class="down">${count("risk")} kritiek</span> · ${count("warn")} vragen aandacht</div></div>
        <div class="card kpi accent"><div class="kpi-label">Bezetting medewerkers</div><div class="kpi-value num">${avgLoad}%</div><div class="kpi-sub"><span class="down">${D.people.filter((p) => p.w[0] > 100).length} medewerkers</span> boven 100% deze week</div></div>
      </div>

      <div class="card card-pad mt">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px">
          <h2>Status portfolio</h2><span class="psub">${P.length} projecten</span>
        </div>
        <div class="stackbar">${seg.map(([s, c]) => `<span style="flex:${count(s)};background:${c}"></span>`).join("")}</div>
        <div class="legend">${seg.map(([s, c]) => `<span><i style="background:${c}"></i>${STATUS[s][1]} <b class="num">${count(s)}</b></span>`).join("")}</div>
      </div>

      <div class="grid g-2-1 mt">
        <div class="card">
          <div class="card-head"><h2>Vragen om aandacht</h2><a href="#/projecten">Alle projecten →</a></div>
          <ul class="list">
            ${att.map((p) => `
              <li onclick="location.hash='#/project/${p.id}'" style="cursor:pointer">
                <div class="grow">
                  <div class="pname">${p.name}</div>
                  <div class="reason">${p.reden || ""}</div>
                </div>
                <div style="width:150px">${progress(p.voortgang, p.status)}</div>
                <div style="width:96px;text-align:right">${badge(p.status)}</div>
              </li>`).join("")}
          </ul>
        </div>
        <div class="card">
          <div class="card-head"><h2>Komende mijlpalen</h2><span class="meta">30 dagen</span></div>
          ${D.milestones.map((m) => { const d = new Date(m.d); return `
            <div class="ms">
              <div class="ms-date"><b>${d.getDate()}</b><small>${MONTHS[d.getMonth()]}</small></div>
              <div><div class="pname" style="font-size:14px">${m.t}</div><div class="psub">${m.p}</div></div>
            </div>`; }).join("")}
        </div>
      </div>

      <div class="grid g-1-1 mt">
        <div class="card card-pad">
          <h2 style="margin-bottom:10px">Budget per programma</h2>
          ${progs.map(([n, v]) => `<div class="hbar"><span>${n}</span><div class="track"><span style="width:${(v / maxProg) * 100}%"></span></div><span class="val num">${eur(v)}</span></div>`).join("")}
        </div>
        <div class="card card-pad">
          <h2 style="margin-bottom:10px">Projecten per fase</h2>
          ${["Initiatief", "Planvorming", "Ontwerp", "Uitvoering", "Realisatie", "Afronding"].map((f) => {
            const n = P.filter((p) => p.fase === f).length;
            return `<div class="hbar"><span>${f}</span><div class="track"><span style="width:${(n / 4) * 100}%;background:var(--venlo-accent)"></span></div><span class="val num">${n}</span></div>`;
          }).join("")}
        </div>
      </div>`;
  }

  /* ------------------------------ Projecten ------------------------------ */
  function projecten() {
    const progs = [...new Set(D.projects.map((p) => p.programma))];
    return `
      <div class="page-head">
        <div><h1>Projecten</h1><p>${D.projects.length} lopende projecten in ${progs.length} programma's</p></div>
        <div class="btn-row"><button class="btn">Kolommen</button><button class="btn">Exporteer naar Excel</button><button class="btn primary">+ Nieuw project</button></div>
      </div>
      <div class="card">
        <div class="filters">
          <button class="chip on">Alle</button>
          <button class="chip">Kritiek</button>
          <button class="chip">Aandacht</button>
          <button class="chip">Op koers</button>
          <button class="chip">Mijn projecten</button>
          <span class="spacer"></span>
          <select class="select"><option>Alle programma's</option>${progs.map((p) => `<option>${p}</option>`).join("")}</select>
          <select class="select"><option>Alle fasen</option></select>
          <select class="select"><option>Sorteer: status</option></select>
        </div>
        <div class="table-wrap">
        <table class="table">
          <thead><tr>
            <th>Project</th><th>Programma</th><th>Projectleider</th><th>Fase</th><th>Status</th><th style="width:170px">Voortgang</th><th class="right">Budget</th><th class="right">Besteed</th><th>Einddatum</th>
          </tr></thead>
          <tbody>
            ${[...D.projects].sort((a, b) => ["risk", "warn", "ok", "done"].indexOf(a.status) - ["risk", "warn", "ok", "done"].indexOf(b.status)).map((p) => `
              <tr onclick="location.hash='#/project/${p.id}'">
                <td style="min-width:220px"><div class="pname">${p.name}</div><div class="psub">${p.id}</div></td>
                <td><span class="tag">${p.programma}</span></td>
                <td><div class="member"><div class="avatar sm">${initials(p.leider)}</div>${p.leider}</div></td>
                <td>${p.fase}</td>
                <td>${badge(p.status)}</td>
                <td>${progress(p.voortgang, p.status)}</td>
                <td class="right num nowrap">${eur(p.budget)}</td>
                <td class="right num" style="color:${p.besteed / p.budget > 0.9 && p.voortgang < 90 ? "var(--risk)" : "inherit"}">${Math.round((p.besteed / p.budget) * 100)}%</td>
                <td class="num nowrap">${fmtDate(p.eind)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        </div>
      </div>`;
  }

  /* ---------------------------- Projectdetail ---------------------------- */
  function project(id) {
    const p = D.projects.find((x) => x.id === id) || D.projects[0];
    // Gantt: jan 2025 - dec 2027 (36 maanden)
    const start = new Date("2025-01-01"), months = 36;
    const pos = (s) => { const d = new Date(s); return (((d.getFullYear() - 2025) * 12 + d.getMonth() + d.getDate() / 31) / months) * 100; };
    const phases = [
      ["Initiatief", "2025-01-06", "2025-04-30", "done"],
      ["Ontwerp (VO/DO)", "2025-04-01", "2025-11-30", "done"],
      ["Aanbesteding", "2025-10-01", "2026-03-15", "done"],
      ["Realisatie kade", "2026-03-01", "2027-02-28", "active"],
      ["Realisatie boulevard", "2026-09-01", "2027-07-31", "active"],
      ["Oplevering & nazorg", "2027-07-01", "2027-09-30", "plan"],
    ];
    const team = [
      [p.leider, "Projectleider"], ["Kevin Driessen", "Werkvoorbereider"], ["Ruben Hermans", "Landschapsarchitect"],
      ["Tom Verheijen", "Planeconoom"], ["Eva Coenen", "Projectondersteuner"], ["Joost Lemmen", "Bestuurlijk opdrachtgever"],
    ];
    return `
      <div class="crumbs"><a href="#/projecten">Projecten</a> / ${p.programma} / ${p.id}</div>
      <div class="card hero">
        <div>
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:6px">${badge(p.status)}<span class="tag">${p.programma}</span><span class="tag">Fase: ${p.fase}</span></div>
          <h1>${p.name}</h1>
          <p style="margin:6px 0 0;color:var(--text-2);max-width:760px">Vernieuwing van de Maaskade tussen de Maasbrug en de Weerd: vervanging kademuur, verbreding wandelpromenade, nieuwe groenstructuur en hoogwaterbescherming.</p>
          <div class="hero-meta">
            <div><span>Projectleider</span><b>${p.leider}</b></div>
            <div><span>Opdrachtgever</span><b>Wethouder Ruimte</b></div>
            <div><span>Startdatum</span><b>6 jan 2025</b></div>
            <div><span>Einddatum</span><b>${fmtDate(p.eind)}</b></div>
            <div><span>Laatste update</span><b>12 nov 2026</b></div>
          </div>
        </div>
        <div class="btn-row" style="align-items:flex-start"><button class="btn">Statusrapport (PDF)</button><button class="btn primary">Update toevoegen</button></div>
      </div>

      <div class="dims mt">
        <div class="dim warn"><div class="label">Tijd</div><div class="val">${badge("warn")}</div><div class="note">6 weken vertraging op aanbesteding kademuur</div></div>
        <div class="dim ok"><div class="label">Geld</div><div class="val">${badge("ok")}</div><div class="note">67% besteed bij 62% voortgang</div></div>
        <div class="dim ok"><div class="label">Scope</div><div class="val">${badge("ok")}</div><div class="note">Geen wijzigingen sinds raadsbesluit</div></div>
        <div class="dim ok"><div class="label">Kwaliteit</div><div class="val">${badge("ok")}</div><div class="note">Toetsing VO/DO akkoord</div></div>
        <div class="dim warn"><div class="label">Risico's</div><div class="val">${badge("warn")}</div><div class="note">1 hoog, 2 midden risico's open</div></div>
      </div>

      <div class="card mt">
        <div class="card-head"><h2>Planning</h2><span class="meta">2025 – 2027</span></div>
        <div class="gantt">
          <div class="gantt-head"><span></span>
            <div class="gantt-months" style="grid-template-columns:repeat(3,1fr)"><span>2025</span><span>2026</span><span>2027</span></div>
          </div>
          <div class="gantt-body">
            <div class="gantt-overlay"><div class="today-line" style="left:${pos(D.today)}%"><span class="today-flag">vandaag</span></div></div>
            ${phases.map(([n, a, b, s]) => `
              <div class="gantt-row"><div class="gantt-label">${n}</div>
                <div class="gantt-track"><div class="gantt-bar ${s}" style="left:${pos(a)}%;width:${pos(b) - pos(a)}%">${s === "done" ? "✓ gereed" : s === "active" ? "loopt" : "gepland"}</div></div>
              </div>`).join("")}
          </div>
        </div>
      </div>

      <div class="grid g-3 mt">
        <div class="card">
          <div class="card-head"><h2>Financiën</h2><span class="meta">x € 1 mln</span></div>
          <div class="card-pad">
            <div class="budget-figs">
              <div><span>Budget</span><b class="num">${p.budget.toLocaleString("nl-NL",{minimumFractionDigits:1})}</b></div>
              <div><span>Besteed</span><b class="num">${p.besteed.toLocaleString("nl-NL",{minimumFractionDigits:1})}</b></div>
              <div><span>Verplicht</span><b class="num">1,9</b></div>
            </div>
            <div class="stackbar" style="height:12px">
              <span style="flex:${p.besteed};background:var(--venlo-blue-700)"></span>
              <span style="flex:1.9;background:#9fbde3"></span>
              <span style="flex:${p.budget - p.besteed - 1.9};background:var(--line)"></span>
            </div>
            <div class="legend"><span><i style="background:var(--venlo-blue-700)"></i>Besteed</span><span><i style="background:#9fbde3"></i>Verplicht</span><span><i style="background:var(--line)"></i>Vrij</span></div>
            <p class="psub" style="margin-top:14px">Prognose einde project: <b style="color:var(--text)">€ 8,6 mln</b> (+2%) — binnen tolerantie.</p>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h2>Risico's</h2><a href="#">Register →</a></div>
          <div class="risk-row" style="font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;padding-top:8px;padding-bottom:8px"><span>Risico</span><span>Score</span><span>Eigenaar</span></div>
          <div class="risk-row"><span>Hoogwater tijdens kadewerkzaamheden</span><span class="score h">16</span><span class="psub">K. Driessen</span></div>
          <div class="risk-row"><span>Prijsstijging staal en beton</span><span class="score m">9</span><span class="psub">T. Verheijen</span></div>
          <div class="risk-row"><span>Bezwaren horeca tijdens bouw</span><span class="score m">8</span><span class="psub">A. Peeters</span></div>
          <div class="risk-row"><span>Archeologische vondsten</span><span class="score l">4</span><span class="psub">R. Hermans</span></div>
        </div>
        <div class="card">
          <div class="card-head"><h2>Recente updates</h2></div>
          <ul class="timeline">
            <li><time>12 nov 2026 · A. Peeters</time>Inschrijvingen kademuur beoordeeld; gunning verwacht 24 nov.</li>
            <li><time>28 okt 2026 · K. Driessen</time>Bouwweg langs Maaskade aangelegd, verkeersmaatregelen actief.</li>
            <li><time>14 okt 2026 · Stuurgroep</time>Vertraging aanbesteding geaccepteerd; buffer inzetten.</li>
            <li><time>30 sep 2026 · E. Coenen</time>Q3-rapportage opgeleverd aan raad.</li>
          </ul>
        </div>
      </div>

      <div class="grid g-2-1 mt">
        <div class="card">
          <div class="card-head"><h2>Mijlpalen</h2></div>
          <table class="table">
            <thead><tr><th>Mijlpaal</th><th>Gepland</th><th>Prognose</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>Raadsbesluit kredietaanvraag</td><td class="num">15 mrt 2025</td><td class="num">15 mrt 2025</td><td>${badge("done").replace("Afronding", "Gereed")}</td></tr>
              <tr><td>Definitief ontwerp vastgesteld</td><td class="num">30 nov 2025</td><td class="num">28 nov 2025</td><td>${badge("done").replace("Afronding", "Gereed")}</td></tr>
              <tr><td>Gunning kademuur</td><td class="num">15 okt 2026</td><td class="num">24 nov 2026</td><td>${badge("warn").replace("Aandacht", "Vertraagd")}</td></tr>
              <tr><td>Kademuur gereed</td><td class="num">31 jan 2027</td><td class="num">15 mrt 2027</td><td>${badge("warn").replace("Aandacht", "Risico")}</td></tr>
              <tr><td>Oplevering boulevard</td><td class="num">30 sep 2027</td><td class="num">30 sep 2027</td><td>${badge("ok")}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="card">
          <div class="card-head"><h2>Projectteam</h2><span class="meta">${team.length} personen · 3,4 fte</span></div>
          <div class="team">
            ${team.map(([n, r]) => `<div class="member"><div class="avatar sm">${initials(n)}</div><div>${n}<small>${r}</small></div></div>`).join("")}
          </div>
        </div>
      </div>`;
  }

  /* ------------------------------ Resources ------------------------------ */
  function resources() {
    const lvl = (v) => (v === 0 ? 0 : v < 60 ? 1 : v < 85 ? 2 : v <= 100 ? 3 : v <= 115 ? 4 : 5);
    const teams = {};
    D.people.forEach((p) => { (teams[p.team] = teams[p.team] || []).push(p.w[0]); });
    const over = D.people.filter((p) => p.w[0] > 100).length;
    const avail = D.people.filter((p) => p.w[0] < 70);
    return `
      <div class="page-head">
        <div><h1>Resources & capaciteit</h1><p>Inzet van medewerkers op projecten, komende 8 weken</p></div>
        <div class="btn-row"><select class="select"><option>Alle teams</option></select><select class="select"><option>Komende 8 weken</option></select><button class="btn primary">Inzet plannen</button></div>
      </div>
      <div class="grid g-4">
        <div class="card kpi accent"><div class="kpi-label">Medewerkers in portfolio</div><div class="kpi-value num">${D.people.length}</div><div class="kpi-sub">28,5 fte beschikbaar</div></div>
        <div class="card kpi accent"><div class="kpi-label">Gem. bezetting deze week</div><div class="kpi-value num">${Math.round(D.people.reduce((a, p) => a + p.w[0], 0) / D.people.length)}%</div><div class="kpi-sub">Norm: 80 – 100%</div></div>
        <div class="card kpi accent"><div class="kpi-label">Overbelast (&gt;100%)</div><div class="kpi-value num" style="color:var(--risk)">${over}</div><div class="kpi-sub">Piek in wk 49: 4 personen</div></div>
        <div class="card kpi accent"><div class="kpi-label">Beschikbare capaciteit</div><div class="kpi-value num" style="color:var(--ok)">${avail.length}</div><div class="kpi-sub">medewerkers onder 70%</div></div>
      </div>

      <div class="grid g-2-1 mt">
        <div class="card">
          <div class="card-head"><h2>Bezetting per medewerker</h2>
            <div class="heat-legend"><span><i class="h1"></i>&lt;60%</span><span><i class="h2"></i>60–85%</span><span><i class="h3"></i>85–100%</span><span><i class="h4"></i>100–115%</span><span><i class="h5"></i>&gt;115%</span></div>
          </div>
          <div class="card-pad table-wrap">
            <table class="heat">
              <thead><tr><th class="left">Medewerker</th>${D.weeks.map((w) => `<th>${w}</th>`).join("")}</tr></thead>
              <tbody>
                ${D.people.map((p) => `<tr><td class="who">${p.n}<small>${p.r} · ${p.team}</small></td>${p.w.map((v) => `<td class="h${lvl(v)}">${v}%</td>`).join("")}</tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-head"><h2>Bezetting per team</h2><span class="meta">deze week</span></div>
            ${Object.entries(teams).map(([t, arr]) => { const v = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length); const c = v > 100 ? "risk" : v > 90 ? "warn" : "ok"; return `
              <div class="cap-team"><div class="top"><b>${t}</b><span class="num">${v}% · ${arr.length} pers.</span></div><div class="progress ${c}"><span style="width:${Math.min(v, 100)}%"></span></div></div>`; }).join("")}
          </div>
          <div class="card mt">
            <div class="card-head"><h2>Signalen</h2></div>
            <ul class="list">
              <li><span class="badge risk">Kritiek</span><div class="grow"><b>Team I&amp;A</b><div class="reason">Mark Smeets en Fatima El Amrani &gt;120% in wk 48–50 door go-live DSO en werkplekuitrol.</div></div></li>
              <li><span class="badge warn">Aandacht</span><div class="grow"><b>Anouk Peeters</b><div class="reason">Leidt 2 realisatieprojecten tegelijk; piek rond gunning kademuur.</div></div></li>
              <li><span class="badge ok">Kans</span><div class="grow"><b>Eva Coenen, Ruben Hermans</b><div class="reason">Ruimte beschikbaar in december voor ondersteuning.</div></div></li>
            </ul>
          </div>
        </div>
      </div>`;
  }

  /* ------------------------------- Router -------------------------------- */
  function render() {
    const [, route = "dashboard", arg] = (location.hash || "#/dashboard").split("/");
    const html = { dashboard, projecten, project: () => project(arg), resources }[route];
    view.innerHTML = (html || dashboard)();
    document.querySelectorAll("#nav a[data-route]").forEach((a) => a.classList.toggle("active", a.dataset.route === route));
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", render);
  render();
})();
