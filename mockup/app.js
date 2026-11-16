(function () {
  const D = window.PPM;
  const A = D.activiteiten;
  const ME = D.gebruiker.naam;
  const TODAY = new Date(D.peildatum);
  const view = document.getElementById("view");

  /* ------------------------------- helpers ------------------------------- */
  const MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const dt = (s) => new Date(s);
  const fmtDate = (s) => { const d = dt(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const days = (s) => Math.round((dt(s) - TODAY) / 864e5);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // "Achternaam, Voornaam (CODE)" -> "Voornaam Achternaam"
  const person = (s) => { if (!s) return "Onbekend"; const m = s.match(/^(.*?),\s*(.*?)\s*\((.*?)\)$/); return m ? `${m[2]} ${m[1]}` : s; };
  const initials = (s) => person(s).split(" ").filter((w) => /^[A-ZÀ-Ý]/.test(w)).map((w) => w[0]).slice(0, 2).join("") || "?";
  // "Informatiemanagement (RGIMAN)" -> {name, code}
  const team = (s) => { const m = (s || "").match(/^(.*?)\s*\((.*?)\)$/); return m ? { name: m[1], code: m[2] } : { name: s || "—", code: "" }; };
  const teamName = (s) => team(s).name;
  const overdue = (a) => days(a.eind) < 0;
  const isRegulier = (a) => a.soort !== "Project";
  const mine = (a) => a.verantwoordelijk === ME;
  const activeIn = (a) => !mine(a) && a.leden.includes(ME);

  const STATUS = { ok: ["ok", "Op koers"], warn: ["warn", "Aandacht"], risk: ["risk", "Kritiek"], plan: ["plan", "Nog niet gestart"] };
  const badge = (s) => `<span class="badge ${STATUS[s][0]}">${STATUS[s][1]}</span>`;
  const soortTag = (a) => `<span class="tag ${isRegulier(a) ? "tag-reg" : ""}">${isRegulier(a) ? "Reguliere taak" : "Project"}</span>`;
  const timeCell = (a) => a.verstreken == null
    ? `<span class="psub">Doorlopend</span>`
    : `<div class="prog-cell"><div class="progress ${a.gezondheid}"><span style="width:${a.verstreken}%"></span></div><span class="num">${a.verstreken}%</span></div>`;
  const endLabel = (a) => {
    const d = days(a.eind);
    if (d < 0) return `<span class="due over">${Math.abs(d)} dagen over einddatum</span>`;
    if (d <= 90) return `<span class="due soon">nog ${d} dagen</span>`;
    return `<span class="due">t/m ${fmtDate(a.eind)}</span>`;
  };
  const ORDER = ["risk", "warn", "ok", "plan"];
  const byHealth = (a, b) => ORDER.indexOf(a.gezondheid) - ORDER.indexOf(b.gezondheid) || dt(a.eind) - dt(b.eind);
  const count = (arr, fn) => { const m = {}; arr.forEach((x) => [].concat(fn(x)).forEach((k) => { if (k) m[k] = (m[k] || 0) + 1; })); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const hbars = (rows, color = "") => { const max = Math.max(...rows.map((r) => r[1]), 1); return rows.map(([n, v]) => `<div class="hbar"><span>${esc(n)}</span><div class="track"><span style="width:${(v / max) * 100}%;${color}"></span></div><span class="val num">${v}</span></div>`).join(""); };

  const card = (a) => `
    <a class="pcard" href="#/project/${a.id}" data-soort="${esc(a.soort)}">
      <div class="pcard-top">${badge(a.gezondheid)}${soortTag(a)}</div>
      <div class="pname">${esc(a.naam)}</div>
      <div class="psub">${esc(teamName(a.team))} · ${esc(person(a.verantwoordelijk))}</div>
      ${timeCell(a)}
      <div class="pcard-foot"><span>${esc(a.programma)}</span>${endLabel(a)}</div>
    </a>`;

  /* ------------------------------- login --------------------------------- */
  document.getElementById("ms-login").addEventListener("click", (e) => {
    const b = e.currentTarget;
    b.classList.add("busy");
    b.querySelector("span").textContent = "Doorsturen naar Microsoft…";
    setTimeout(() => { b.classList.remove("busy"); b.querySelector("span").textContent = "Inloggen met Microsoft"; location.hash = "#/home"; }, 900);
  });

  /* ---------------------------- Mijn overzicht --------------------------- */
  function home() {
    const own = A.filter(mine).sort(byHealth);
    const act = A.filter(activeIn).sort(byHealth);
    const both = own.concat(act);
    const soon = both.filter((a) => days(a.eind) >= 0 && days(a.eind) <= 120).sort((a, b) => dt(a.eind) - dt(b.eind));
    const attention = own.filter((a) => a.gezondheid === "risk" || a.gezondheid === "warn" || overdue(a));
    const noDesc = own.filter((a) => !a.omschrijving).length;
    return `
      <div class="page-head">
        <div><h1>Goedemorgen, ${esc(person(ME).split(" ")[0])}</h1><p>${esc(D.gebruiker.functie)} · peildatum ${fmtDate(D.peildatum)}</p></div>
      </div>

      <div class="grid g-4">
        <a class="card kpi accent" href="#/projecten?f=mijn"><div class="kpi-label">Verantwoordelijk voor</div><div class="kpi-value num">${own.length}</div><div class="kpi-sub">${own.filter((a) => !isRegulier(a)).length} projecten · ${own.filter(isRegulier).length} reguliere taken</div></a>
        <a class="card kpi accent" href="#/projecten?f=actief"><div class="kpi-label">Actief in</div><div class="kpi-value num">${act.length}</div><div class="kpi-sub">als projectlid bij andere teams</div></a>
        <div class="card kpi accent"><div class="kpi-label">Einddatum binnen 4 mnd</div><div class="kpi-value num">${soon.length}</div><div class="kpi-sub">eerstvolgende ${soon[0] ? fmtDate(soon[0].eind) : "—"}</div></div>
        <div class="card kpi accent"><div class="kpi-label">Vraagt mijn aandacht</div><div class="kpi-value num" style="color:var(--risk)">${attention.length}</div><div class="kpi-sub"><span class="down">${own.filter(overdue).length} over einddatum</span></div></div>
      </div>

      <div class="grid g-2-1 mt">
        <div>
          <div class="card">
            <div class="card-head"><div><h2>Waar ik verantwoordelijk voor ben</h2><span class="meta">${own.length} activiteiten</span></div><a href="#/projecten?f=mijn">Alles →</a></div>
            <div class="seg" data-target="own">
              <button class="on" data-v="all">Alle</button><button data-v="Project">Projecten</button><button data-v="Reguliere taken">Taken</button>
            </div>
            <div class="plist cards-2" id="own">${own.map(card).join("")}</div>
          </div>
          <div class="card mt">
            <div class="card-head"><div><h2>Waarin ik actief ben</h2><span class="meta">${act.length} activiteiten van andere verantwoordelijken</span></div><a href="#/projecten?f=actief">Alles →</a></div>
            <div class="plist cards-2">${act.slice(0, 6).map(card).join("")}</div>
            ${act.length > 6 ? `<a class="more" href="#/projecten?f=actief">Toon alle ${act.length} activiteiten →</a>` : ""}
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-head"><h2>Binnenkort einddatum</h2><span class="meta">120 dagen</span></div>
            ${soon.length ? soon.map((a) => { const d = dt(a.eind); return `
              <a class="ms" href="#/project/${a.id}">
                <div class="ms-date"><b>${d.getDate()}</b><small>${MONTHS[d.getMonth()]}</small></div>
                <div><div class="pname" style="font-size:14px">${esc(a.naam)}</div><div class="psub">${mine(a) ? "Verantwoordelijk" : "Projectlid"} · ${esc(teamName(a.team))}</div></div>
              </a>`; }).join("") : `<p class="empty">Geen einddata in de komende 4 maanden.</p>`}
          </div>
          <div class="card mt">
            <div class="card-head"><h2>Signalen</h2></div>
            <ul class="list">
              ${own.filter(overdue).map((a) => `<li><span class="badge risk">Over datum</span><div class="grow"><a href="#/project/${a.id}"><b>${esc(a.naam)}</b></a><div class="reason">Einddatum ${fmtDate(a.eind)} verstreken, status nog "Lopend". Verlengen of afsluiten?</div></div></li>`).join("")}
              ${noDesc ? `<li><span class="badge warn">Data</span><div class="grow"><b>${noDesc} activiteiten zonder omschrijving</b><div class="reason">Vul de omschrijving aan voor beter inzicht bij collega's.</div></div></li>` : ""}
              <li><span class="badge ok">Info</span><div class="grow"><b>Teamplan 2027</b><div class="reason">${own.filter((a) => a.teamplanJaren.includes(2027)).length} van je activiteiten zijn relevant voor teamplan 2027.</div></div></li>
            </ul>
          </div>
        </div>
      </div>`;
  }

  /* ------------------------------ Portfolio ------------------------------ */
  function portfolio() {
    const proj = A.filter((a) => !isRegulier(a));
    const cnt = (s) => A.filter((a) => a.gezondheid === s).length;
    const att = A.filter((a) => a.gezondheid === "risk" || overdue(a)).sort(byHealth).slice(0, 7);
    const ending = A.filter((a) => days(a.eind) >= 0 && days(a.eind) <= 182).sort((a, b) => dt(a.eind) - dt(b.eind)).slice(0, 6);
    const seg = [["ok", "var(--ok-bar)"], ["warn", "var(--warn-bar)"], ["risk", "var(--risk-bar)"], ["plan", "#A9B6B6"]];
    return `
      <div class="page-head">
        <div><h1>Portfolio</h1><p>Alle lopende activiteiten van gemeente Venlo · export ${fmtDate(D.peildatum)}</p></div>
        <div class="btn-row only-desk"><button class="btn">Exporteer</button><button class="btn primary">+ Nieuwe activiteit</button></div>
      </div>
      <div class="grid g-4">
        <div class="card kpi accent"><div class="kpi-label">Lopende activiteiten</div><div class="kpi-value num">${A.length}</div><div class="kpi-sub">${proj.length} projecten · ${A.length - proj.length} reguliere taken</div></div>
        <div class="card kpi accent"><div class="kpi-label">Teams verantwoordelijk</div><div class="kpi-value num">${new Set(A.map((a) => a.team)).size}</div><div class="kpi-sub">${new Set(A.map((a) => a.verantwoordelijk)).size} verantwoordelijken</div></div>
        <div class="card kpi accent"><div class="kpi-label">Bedrijfsvoeringsbreed</div><div class="kpi-value num">${A.filter((a) => a.bvBreed === "Ja").length}</div><div class="kpi-sub">${A.filter((a) => a.ontwikkellijn).length} in een ontwikkellijn</div></div>
        <div class="card kpi accent"><div class="kpi-label">Over einddatum</div><div class="kpi-value num" style="color:var(--risk)">${A.filter(overdue).length}</div><div class="kpi-sub">status nog "Lopend"</div></div>
      </div>

      <div class="card card-pad mt">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px"><h2>Gezondheid portfolio</h2><span class="psub">${A.length} activiteiten</span></div>
        <div class="stackbar">${seg.map(([s, c]) => `<span style="flex:${cnt(s)};background:${c}"></span>`).join("")}</div>
        <div class="legend">${seg.map(([s, c]) => `<span><i style="background:${c}"></i>${STATUS[s][1]} <b class="num">${cnt(s)}</b></span>`).join("")}</div>
      </div>

      <div class="grid g-2-1 mt">
        <div class="card">
          <div class="card-head"><h2>Vragen om aandacht</h2><a href="#/projecten?f=aandacht">Alle →</a></div>
          <ul class="list">
            ${att.map((a) => `
              <li onclick="location.hash='#/project/${a.id}'" style="cursor:pointer">
                <div class="grow"><div class="pname">${esc(a.naam)}</div>
                <div class="reason">${esc(teamName(a.team))} · ${esc(person(a.verantwoordelijk))} · ${overdue(a) ? `<span class="due over">einddatum ${fmtDate(a.eind)} verstreken</span>` : `eind ${fmtDate(a.eind)}`}</div></div>
                <div class="att-badge">${badge(a.gezondheid)}</div>
              </li>`).join("")}
          </ul>
        </div>
        <div class="card">
          <div class="card-head"><h2>Einddatum &lt; 6 maanden</h2></div>
          ${ending.map((a) => { const d = dt(a.eind); return `
            <a class="ms" href="#/project/${a.id}">
              <div class="ms-date"><b>${d.getDate()}</b><small>${MONTHS[d.getMonth()]}</small></div>
              <div><div class="pname" style="font-size:14px">${esc(a.naam)}</div><div class="psub">${esc(teamName(a.team))}</div></div>
            </a>`; }).join("")}
        </div>
      </div>

      <div class="grid g-3 mt">
        <div class="card card-pad"><h2 style="margin-bottom:10px">Per programma</h2>${hbars(count(A, (a) => a.programma))}</div>
        <div class="card card-pad"><h2 style="margin-bottom:10px">Categorie teamplan</h2>${hbars(count(A, (a) => a.categorie || "Niet ingevuld"), "background:var(--venlo-blauw)")}</div>
        <div class="card card-pad"><h2 style="margin-bottom:10px">Meest betrokken teams</h2>${hbars(count(A, (a) => a.teamsBetrokken.map(teamName)).slice(0, 6), "background:var(--vbg-75)")}</div>
      </div>`;
  }

  /* ------------------------- Projecten & taken --------------------------- */
  const F = { chip: "alle", programma: "", team: "", q: "" };
  function applyFilters() {
    return A.filter((a) => {
      if (F.chip === "project" && isRegulier(a)) return false;
      if (F.chip === "regulier" && !isRegulier(a)) return false;
      if (F.chip === "mijn" && !mine(a)) return false;
      if (F.chip === "actief" && !activeIn(a)) return false;
      if (F.chip === "aandacht" && !(a.gezondheid === "risk" || a.gezondheid === "warn" || overdue(a))) return false;
      if (F.programma && a.programma !== F.programma) return false;
      if (F.team && a.team !== F.team) return false;
      if (F.q) { const q = F.q.toLowerCase(); if (![a.naam, a.omschrijving, a.team, person(a.verantwoordelijk), String(a.id)].join(" ").toLowerCase().includes(q)) return false; }
      return true;
    }).sort(byHealth);
  }
  function projectRows(list) {
    return {
      cards: list.map(card).join("") || `<p class="empty">Geen activiteiten gevonden.</p>`,
      rows: list.map((a) => `
        <tr onclick="location.hash='#/project/${a.id}'">
          <td style="min-width:230px"><div class="pname">${esc(a.naam)}</div><div class="psub">#${a.id} · ${isRegulier(a) ? "Reguliere taak" : "Project"}</div></td>
          <td><div>${esc(teamName(a.team))}</div><div class="psub">${team(a.team).code}</div></td>
          <td><div class="member"><div class="avatar sm">${initials(a.verantwoordelijk)}</div>${esc(person(a.verantwoordelijk))}</div></td>
          <td>${esc(a.programma)}</td>
          <td>${badge(a.gezondheid)}</td>
          <td style="width:150px">${timeCell(a)}</td>
          <td class="num nowrap">${fmtDate(a.start)}</td>
          <td class="num nowrap" style="${overdue(a) ? "color:var(--risk);font-weight:600" : ""}">${fmtDate(a.eind)}</td>
        </tr>`).join("") || `<tr><td colspan="8" class="empty">Geen activiteiten gevonden.</td></tr>`,
    };
  }
  function projecten(params) {
    if (params.get("f")) F.chip = params.get("f");
    const progs = [...new Set(A.map((a) => a.programma))].sort();
    const teams = [...new Set(A.map((a) => a.team))].sort();
    const chips = [["alle", "Alle"], ["mijn", "Mijn verantwoordelijkheid"], ["actief", "Actief in"], ["aandacht", "Aandacht"], ["project", "Projecten"], ["regulier", "Reguliere taken"]];
    const list = applyFilters();
    const r = projectRows(list);
    return `
      <div class="page-head">
        <div><h1>Projecten &amp; taken</h1><p id="count">${list.length} van ${A.length} lopende activiteiten</p></div>
        <div class="btn-row only-desk"><button class="btn">Exporteer naar Excel</button><button class="btn primary">+ Nieuwe activiteit</button></div>
      </div>
      <div class="card">
        <div class="filters">
          <div class="chips">${chips.map(([k, l]) => `<button class="chip ${F.chip === k ? "on" : ""}" data-chip="${k}">${l}</button>`).join("")}</div>
          <span class="spacer"></span>
          <input class="select fsearch" type="search" id="q" placeholder="Zoeken…" value="${esc(F.q)}">
          <select class="select" id="fprog"><option value="">Alle programma's</option>${progs.map((p) => `<option ${F.programma === p ? "selected" : ""}>${esc(p)}</option>`).join("")}</select>
          <select class="select" id="fteam"><option value="">Alle teams</option>${teams.map((t) => `<option value="${esc(t)}" ${F.team === t ? "selected" : ""}>${esc(teamName(t))}</option>`).join("")}</select>
        </div>
        <div class="only-mob plist" id="pcards">${r.cards}</div>
        <div class="table-wrap only-desk">
          <table class="table">
            <thead><tr><th>Activiteit</th><th>Team verantwoordelijk</th><th>Verantwoordelijk</th><th>Programma</th><th>Gezondheid</th><th>Doorlooptijd</th><th>Start</th><th>Eind</th></tr></thead>
            <tbody id="prows">${r.rows}</tbody>
          </table>
        </div>
      </div>`;
  }
  function bindProjecten() {
    const refresh = () => {
      const list = applyFilters(); const r = projectRows(list);
      document.getElementById("pcards").innerHTML = r.cards;
      document.getElementById("prows").innerHTML = r.rows;
      document.getElementById("count").textContent = `${list.length} van ${A.length} lopende activiteiten`;
      document.querySelectorAll("[data-chip]").forEach((c) => c.classList.toggle("on", c.dataset.chip === F.chip));
    };
    document.querySelectorAll("[data-chip]").forEach((c) => c.addEventListener("click", () => { F.chip = c.dataset.chip; refresh(); }));
    document.getElementById("fprog").addEventListener("change", (e) => { F.programma = e.target.value; refresh(); });
    document.getElementById("fteam").addEventListener("change", (e) => { F.team = e.target.value; refresh(); });
    document.getElementById("q").addEventListener("input", (e) => { F.q = e.target.value; refresh(); });
  }

  /* ---------------------- Strategische weging (matrix) ------------------- */
  const QUAD = (w) => w.uitvoerbaarheid >= 3
    ? (w.complexiteit >= 3 ? ["Strategisch project", "Waardevol maar complex: stuur actief op scope en inzet."] : ["Quick win", "Goed uitvoerbaar en overzichtelijk: snel resultaat boeken."])
    : (w.complexiteit >= 3 ? ["Risicovol", "Complex én lastig uitvoerbaar: herijk aanpak of fasering."] : ["Heroverwegen", "Beperkt uitvoerbaar: randvoorwaarden regelen of herprioriteren."]);
  function matrix(a) {
    const W = 360, H = 290, L = 44, R = 12, T = 12, B = 44;
    const x = (v) => L + ((v - 1) / 4) * (W - L - R);
    const y = (v) => T + (1 - (v - 1) / 4) * (H - T - B);
    const cl = (v) => Math.max(1.15, Math.min(4.85, v)); // houd stippen binnen het vlak
    const me = a.weging, q = QUAD(me)[0];
    const quads = [
      ["Risicovol", 1, 3, 3, 5], ["Strategisch project", 3, 5, 3, 5],
      ["Heroverwegen", 1, 3, 1, 3], ["Quick win", 3, 5, 1, 3],
    ];
    const r = (w, big) => (big ? 5 : 2.6) + w.waarde * (big ? 1.4 : 0.8);
    const others = A.filter((o) => o.id !== a.id);
    return `
      <svg class="matrix" viewBox="0 0 ${W} ${H}" role="img" aria-label="Strategische weging: complexiteit ${me.complexiteit}, uitvoerbaarheid ${me.uitvoerbaarheid}, kwadrant ${q}">
        ${quads.map(([n, x0, x1, y0, y1]) => `<rect x="${x(x0)}" y="${y(y1)}" width="${x(x1) - x(x0)}" height="${y(y0) - y(y1)}" class="quad ${n === q ? "on" : ""}"/>`).join("")}
        ${[1, 2, 3, 4, 5].map((v) => `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${H - B}" class="grid ${v === 3 ? "mid" : ""}"/><line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid ${v === 3 ? "mid" : ""}"/>
          <text x="${x(v)}" y="${H - B + 14}" text-anchor="middle" class="tick">${v}</text><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" class="tick">${v}</text>`).join("")}
        <text x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle" class="axis">Uitvoerbaarheid →</text>
        <text transform="translate(12 ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle" class="axis">Complexiteit →</text>
        ${others.map((o) => `<a href="#/project/${o.id}"><circle cx="${x(cl(o.weging.uitvoerbaarheid))}" cy="${y(cl(o.weging.complexiteit))}" r="${r(o.weging)}" class="dot"><title>${esc(o.naam)} – complexiteit ${o.weging.complexiteit}, uitvoerbaarheid ${o.weging.uitvoerbaarheid}, waarde ${o.weging.waarde}/5</title></circle></a>`).join("")}
        ${quads.map(([n, x0, x1, y0, y1]) => `<text x="${x0 < 3 ? x(x0) + 8 : x(x1) - 8}" y="${y1 > 3 ? y(y1) + 16 : y(y0) - 8}" text-anchor="${x0 < 3 ? "start" : "end"}" class="qlabel ${n === q ? "on" : ""}">${n}</text>`).join("")}
        <circle cx="${x(cl(me.uitvoerbaarheid))}" cy="${y(cl(me.complexiteit))}" r="${r(me, true)}" class="dot me"><title>${esc(a.naam)}</title></circle>
        <text x="${x(cl(me.uitvoerbaarheid)) + (me.uitvoerbaarheid > 4.2 ? -1 : 1) * (r(me, true) + 6)}" y="${y(cl(me.complexiteit)) + 4}" text-anchor="${me.uitvoerbaarheid > 4.2 ? "end" : "start"}" class="melabel">Dit project</text>
      </svg>`;
  }
  const scoreBar = (label, v, hint) => `
    <div class="score-row"><div class="top"><span>${label}</span><b class="num">${v.toLocaleString("nl-NL")} <small>/ 5</small></b></div>
    <div class="progress"><span style="width:${(v / 5) * 100}%;background:var(--vbg)"></span></div><small class="psub">${hint}</small></div>`;

  /* ---------------------------- Projectdetail ---------------------------- */
  function project(id) {
    const a = A.find((x) => String(x.id) === String(id)) || A[0];
    const s = dt(a.start), e = dt(a.eind);
    // tijdlijn: start-jaar t/m eind-jaar, begrensd tot 3 jaar rond vandaag
    const y0 = Math.max(s.getFullYear(), TODAY.getFullYear() - 3), y1 = Math.min(e.getFullYear(), TODAY.getFullYear() + 3);
    const t0 = new Date(y0, 0, 1), t1 = new Date(y1 + 1, 0, 1);
    const pos = (d) => Math.max(0, Math.min(100, ((d - t0) / (t1 - t0)) * 100));
    const years = []; for (let y = y0; y <= y1; y++) years.push(y);
    const longRun = e.getFullYear() > y1;
    const role = mine(a) ? "Jij bent verantwoordelijk" : activeIn(a) ? "Jij bent projectlid" : "";
    const other = a.teamsBetrokken.find((t) => t !== a.team);
    const updates = [
      [-4, person(a.verantwoordelijk), `Voortgang besproken in teamoverleg ${teamName(a.team)}.`],
      [-19, person(a.leden[0]), other ? `Afstemming met ${teamName(other)} over planning en inzet.` : "Werkzaamheden volgens planning opgepakt."],
      [-41, "Systeem", `Activiteit opgenomen in teamplan ${a.teamplanJaren.join(", ") || "—"} (${a.ontstaan || "ontstaan onbekend"}).`],
    ];
    const kv = (k, v) => `<div class="kv"><span>${k}</span><b>${v || `<em class="na">Niet ingevuld</em>`}</b></div>`;
    const chipsFor = (list, cls = "") => list.length ? list.map((t) => `<span class="teamchip ${cls}">${esc(teamName(t))} <small>${team(t).code}</small></span>`).join("") : `<em class="na">Niet ingevuld</em>`;
    return `
      <div class="crumbs"><a href="#/projecten">Projecten &amp; taken</a> / ${esc(a.programma)} / #${a.id}</div>
      <div class="card hero">
        <div>
          <div class="hero-tags">${badge(a.gezondheid)}${soortTag(a)}<span class="tag">${esc(a.programma)}</span>${role ? `<span class="tag tag-me">${role}</span>` : ""}</div>
          <h1>${esc(a.naam)}</h1>
          <p class="hero-desc">${a.omschrijving ? esc(a.omschrijving) : `<em class="na">Geen omschrijving in de export.</em>`}</p>
          <div class="hero-meta">
            <div><span>Verantwoordelijk</span><b>${esc(person(a.verantwoordelijk))}</b></div>
            <div><span>Team</span><b>${esc(teamName(a.team))}</b></div>
            <div><span>Startdatum</span><b>${fmtDate(a.start)}</b></div>
            <div><span>Einddatum</span><b style="${overdue(a) ? "color:var(--risk)" : ""}">${fmtDate(a.eind)}</b></div>
            <div><span>Status</span><b>${esc(a.status)}${a.inUitvoering ? " · in uitvoering" : ""}</b></div>
          </div>
        </div>
        <div class="btn-row hero-btns"><button class="btn">⤓ Rapport</button><button class="btn primary">Update toevoegen</button></div>
      </div>

      ${overdue(a) ? `<div class="alert mt"><b>Einddatum verstreken.</b> Deze activiteit staat nog op "Lopend" terwijl de einddatum (${fmtDate(a.eind)}) voorbij is. Verleng de einddatum of sluit de activiteit af.</div>` : ""}

      <div class="card mt">
        <div class="card-head"><h2>Doorlooptijd</h2><span class="meta">${a.verstreken == null ? "doorlopende taak" : `${a.verstreken}% verstreken`}</span></div>
        <div class="tl">
          <div class="tl-years" style="grid-template-columns:repeat(${years.length},1fr)">${years.map((y) => `<span>${y}</span>`).join("")}</div>
          <div class="tl-track">
            <div class="tl-bar ${a.gezondheid}" style="left:${pos(s)}%;width:${Math.max(pos(e) - pos(s), 1)}%">${longRun ? "loopt door t/m " + e.getFullYear() + " →" : ""}</div>
            <div class="today-line" style="left:${pos(TODAY)}%"><span class="today-flag">vandaag</span></div>
          </div>
          <div class="tl-legend"><span>Start ${fmtDate(a.start)}</span><span>Eind ${fmtDate(a.eind)}</span></div>
        </div>
      </div>

      <div class="card mt">
        <div class="card-head"><div><h2>Strategische weging</h2><span class="meta">Waarde van het project op complexiteit en uitvoerbaarheid</span></div><span class="meta">voorbeeldscores</span></div>
        <div class="weging">
          <div class="weging-chart">
            ${matrix(a)}
            <div class="legend"><span><i class="lg-me"></i>Dit project</span><span><i class="lg-other"></i>Overige activiteiten</span><span>Grootte = strategische waarde</span></div>
          </div>
          <div class="weging-side">
            <div class="quad-result"><span class="psub">Kwadrant</span><b>${QUAD(a.weging)[0]}</b><p>${QUAD(a.weging)[1]}</p></div>
            ${scoreBar("Complexiteit", a.weging.complexiteit, "Aantal teams, impact op organisatie, bedrijfsvoeringsbreed")}
            ${scoreBar("Uitvoerbaarheid", a.weging.uitvoerbaarheid, "Capaciteit, planning, afhankelijkheden")}
            <div class="score-row"><div class="top"><span>Strategische waarde</span><b class="num">${a.weging.waarde} <small>/ 5</small></b></div>
              <div class="pips">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= a.weging.waarde ? "on" : ""}"></i>`).join("")}</div><small class="psub">Bijdrage aan programma, ontwikkellijn en teamplan</small></div>
            <button class="btn" style="width:100%;margin-top:6px">Weging aanpassen</button>
          </div>
        </div>
      </div>

      <div class="grid g-3 mt">
        <div class="card">
          <div class="card-head"><h2>Teamplan</h2></div>
          <div class="kvs">
            ${kv("Soort activiteit", esc(a.soort))}
            ${kv("Categorie teamplan", a.categorie && esc(a.categorie))}
            ${kv("Ontstaan", a.ontstaan && esc(a.ontstaan))}
            ${kv("Ontwikkellijn", a.ontwikkellijn && esc(a.ontwikkellijn))}
            ${kv("Relevant voor teamplan", a.teamplanJaren.length ? a.teamplanJaren.map((y) => `<span class="tag">${y}</span>`).join(" ") : "")}
            ${kv("Bedrijfsvoeringsbreed", a.bvBreed && esc(a.bvBreed))}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h2>Teams</h2></div>
          <div class="card-pad">
            <h3 class="sub">Verantwoordelijk</h3><div class="teamchips">${chipsFor([a.team], "lead")}</div>
            <h3 class="sub">Betrokken</h3><div class="teamchips">${chipsFor(a.teamsBetrokken)}</div>
            <h3 class="sub">Impact op team</h3><div class="teamchips">${chipsFor(a.impactOpTeam, "impact")}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h2>Projectleden</h2><span class="meta">${a.leden.length + 1} personen</span></div>
          <div class="team">
            <div class="member"><div class="avatar sm ${mine(a) ? "me" : ""}">${initials(a.verantwoordelijk)}</div><div>${esc(person(a.verantwoordelijk))}${mine(a) ? " (jij)" : ""}<small>Verantwoordelijk</small></div></div>
            ${a.leden.map((l) => `<div class="member"><div class="avatar sm ${l === ME ? "me" : ""}">${initials(l)}</div><div>${esc(person(l))}${l === ME ? " (jij)" : ""}<small>Projectlid</small></div></div>`).join("")}
          </div>
          <p class="mock-note">Projectleden staan niet in de export – voorbeelddata.</p>
        </div>
      </div>

      <div class="grid g-2-1 mt">
        <div class="card">
          <div class="card-head"><h2>Recente updates</h2><span class="meta">voorbeelddata</span></div>
          <ul class="timeline">${updates.map(([d, w, t]) => { const x = new Date(TODAY); x.setDate(x.getDate() + d); return `<li><time>${fmtDate(x)} · ${esc(w)}</time>${esc(t)}</li>`; }).join("")}</ul>
        </div>
        <div class="card">
          <div class="card-head"><h2>Nog aan te vullen</h2></div>
          <div class="card-pad">
            <p class="psub" style="margin:0 0 10px">Niet in de huidige export, wel nodig voor een compleet beeld:</p>
            <ul class="todo"><li>Strategische weging (scores per project)</li><li>Gezondheid (tijd / geld / scope)</li><li>Budget en besteding</li><li>Mijlpalen</li><li>Risico's</li><li>Projectleden en inzet in uren</li></ul>
          </div>
        </div>
      </div>`;
  }

  /* -------------------------------- Teams -------------------------------- */
  function teams() {
    const q0 = new Date(TODAY.getFullYear(), Math.floor(TODAY.getMonth() / 3) * 3, 1);
    const Q = Array.from({ length: 8 }, (_, i) => { const s = new Date(q0); s.setMonth(s.getMonth() + i * 3); const e = new Date(s); e.setMonth(e.getMonth() + 3); return { s, e, k: `K${Math.floor(s.getMonth() / 3) + 1}`, l: `K${Math.floor(s.getMonth() / 3) + 1} '${String(s.getFullYear()).slice(2)}` }; });
    const involved = (a) => [...new Set([a.team, ...a.teamsBetrokken])];
    const tlist = count(A, involved).slice(0, 12).map(([t]) => t);
    const grid = tlist.map((t) => ({ t, w: Q.map((q) => A.filter((a) => involved(a).includes(t) && dt(a.start) < q.e && dt(a.eind) >= q.s).length), lead: A.filter((a) => a.team === t).length }));
    const max = Math.max(...grid.flatMap((g) => g.w));
    const lvl = (v) => (v === 0 ? 0 : v <= max * 0.15 ? 1 : v <= max * 0.35 ? 2 : v <= max * 0.6 ? 3 : v <= max * 0.8 ? 4 : 5);
    const people = count(A, (a) => a.verantwoordelijk).slice(0, 8);
    const pmax = people[0][1];
    return `
      <div class="page-head">
        <div><h1>Teams</h1><p>Lopende activiteiten per team (verantwoordelijk of betrokken), komende 8 kwartalen</p></div>
        <div class="btn-row"><select class="select"><option>Alle programma's</option></select><select class="select"><option>Komende 2 jaar</option></select></div>
      </div>
      <div class="grid g-4">
        <div class="card kpi accent"><div class="kpi-label">Teams in portfolio</div><div class="kpi-value num">${new Set(A.flatMap(involved)).size}</div><div class="kpi-sub">${new Set(A.map((a) => a.team)).size} als verantwoordelijk team</div></div>
        <div class="card kpi accent"><div class="kpi-label">Meest betrokken</div><div class="kpi-value kpi-text">${esc(teamName(tlist[0]))}</div><div class="kpi-sub">${grid[0].w[0]} activiteiten dit kwartaal</div></div>
        <div class="card kpi accent"><div class="kpi-label">Samenwerking</div><div class="kpi-value num">${A.filter((a) => a.teamsBetrokken.length > 1).length}</div><div class="kpi-sub">activiteiten met &gt;1 betrokken team</div></div>
        <div class="card kpi accent"><div class="kpi-label">Impact op organisatie</div><div class="kpi-value num">${A.filter((a) => a.impactOpTeam.length).length}</div><div class="kpi-sub">activiteiten met impact op teams</div></div>
      </div>

      <div class="grid g-2-1 mt">
        <div class="card">
          <div class="card-head"><h2>Lopende activiteiten per kwartaal</h2>
            <div class="heat-legend"><span><i class="h1"></i>laag</span><span><i class="h3"></i>gemiddeld</span><span><i class="h5"></i>piek</span></div>
          </div>
          <div class="only-mob">
            ${grid.map((g) => `
              <div class="person">
                <div class="person-top"><div><b>${esc(teamName(g.t))}</b><small class="psub" style="display:block">${g.lead}× verantwoordelijk team</small></div><span class="pct h${lvl(g.w[0])}">${g.w[0]}</span></div>
                <div class="weeks">${g.w.map((v, i) => `<div><i class="h${lvl(v)}"></i><small>${Q[i].k}</small></div>`).join("")}</div>
              </div>`).join("")}
          </div>
          <div class="card-pad table-wrap only-desk">
            <table class="heat">
              <thead><tr><th class="left">Team</th>${Q.map((q) => `<th>${q.l}</th>`).join("")}</tr></thead>
              <tbody>${grid.map((g) => `<tr><td class="who">${esc(teamName(g.t))}<small>${team(g.t).code} · ${g.lead}× verantwoordelijk</small></td>${g.w.map((v) => `<td class="h${lvl(v)}">${v}</td>`).join("")}</tr>`).join("")}</tbody>
            </table>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-head"><h2>Per verantwoordelijke</h2><span class="meta">aantal activiteiten</span></div>
            ${people.map(([p, n]) => { const c = n >= 8 ? "risk" : n >= 4 ? "warn" : "ok"; return `
              <div class="cap-team"><div class="top"><span class="member"><span class="avatar sm ${p === ME ? "me" : ""}">${initials(p)}</span><b>${esc(person(p))}</b></span><span class="num">${n}</span></div><div class="progress ${c}"><span style="width:${(n / pmax) * 100}%"></span></div></div>`; }).join("")}
          </div>
          <div class="card mt">
            <div class="card-head"><h2>Signalen</h2></div>
            <ul class="list">
              <li><span class="badge risk">Piek</span><div class="grow"><b>${esc(teamName(tlist[0]))}</b><div class="reason">Betrokken bij ${grid[0].w[0]} lopende activiteiten dit kwartaal – check capaciteit.</div></div></li>
              <li><span class="badge warn">Spreiding</span><div class="grow"><b>${esc(person(people[0][0]))}</b><div class="reason">Verantwoordelijk voor ${people[0][1]} activiteiten in deze selectie.</div></div></li>
              <li><span class="badge ok">Info</span><div class="grow"><b>Uren ontbreken</b><div class="reason">Voor inzet in uren/fte is een koppeling met de urenregistratie nodig.</div></div></li>
            </ul>
          </div>
        </div>
      </div>`;
  }

  /* ------------------------------- Router -------------------------------- */
  function render() {
    const raw = (location.hash || "#/login").replace(/^#\/?/, "");
    const [path, qs = ""] = raw.split("?");
    const [route = "login", arg] = path.split("/");
    const params = new URLSearchParams(qs);
    const isLogin = !route || route === "login";
    document.getElementById("login").hidden = !isLogin;
    document.getElementById("app").hidden = isLogin;
    document.body.classList.toggle("on-login", isLogin);
    if (isLogin) return;
    const pages = { home, portfolio, projecten: () => projecten(params), project: () => project(arg), teams };
    view.innerHTML = (pages[route] || home)();
    if (route === "projecten") bindProjecten();
    document.querySelectorAll(".seg").forEach((seg) => seg.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      seg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      document.querySelectorAll(`#${seg.dataset.target} .pcard`).forEach((c) => {
        c.style.display = b.dataset.v === "all" || c.dataset.soort === b.dataset.v ? "" : "none";
      });
    }));
    const navRoute = route === "project" ? "projecten" : route;
    document.querySelectorAll("#nav a[data-route], #tabbar a[data-route]").forEach((a) => a.classList.toggle("active", a.dataset.route === navRoute));
    window.scrollTo(0, 0);
  }
  document.getElementById("search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { F.q = e.target.value; F.chip = "alle"; location.hash = "#/projecten"; render(); }
  });
  window.addEventListener("hashchange", render);
  render();
})();
