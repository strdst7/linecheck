import { SCENARIO_LIST, getScenario } from "./scenarios.js";
import { CHECKS, WHY } from "./checks.js";
import { buildBrief, buildHandoff } from "./engine.js";
import { t, setLang, getLang } from "./i18n.js";
import { MS_SCENARIO, MS_CHECK_LABEL_DETAIL, MS_OPTION, MS_WHY, MS_UNRESOLVED, MS_PRIOR_VISIT, MS_NEIGHBOUR, MS_NEIGHBOUR_NOTE } from "./ms.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isMs = () => getLang() === "ms";

// Scenario fields carry English prose; Malay versions live in ms.js keyed by id.
const sc = (s) => {
  const m = isMs() && MS_SCENARIO[s.id];
  return {
    ...s,
    windows: m?.windows ?? s.windows,
    address: m?.address ?? s.address,
    accessNotes: m?.accessNotes ?? s.accessNotes,
    safety: m?.safety ?? s.safety,
    reported: m?.report ?? s.report.reported,
    prevVisits: s.prevVisits.map((v) => ({
      ...v,
      found: m?.prevFound?.[v.conclusion] ?? MS_PRIOR_VISIT[v.found] ?? v.found,
    })),
    customers: s.customers.map((c) => ({
      ...c,
      line: (isMs() && MS_NEIGHBOUR[c.line]) || c.line,
      role: (isMs() && MS_NEIGHBOUR[c.role]) || c.role,
      note: (isMs() && MS_NEIGHBOUR_NOTE[c.note]) || c.note,
    })),
  };
};

const state = {
  scenarioId: SCENARIO_LIST[0].id,
  answers: {},
  profile: { repeats: "unknown", tries: "none", field: "" },
  brief: null,
  handoff: null,
  view: "start",
};

/* ---------- navigation ---------- */
function show(id) {
  state.view = id;
  document.querySelectorAll(".view").forEach((v) => { v.hidden = v.id !== id; });
  document.querySelectorAll(".step").forEach((b) => {
    const on = b.dataset.goto === id;
    if (on) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
  });
  window.scrollTo({ top: 0, behavior: "instant" });
  if (id === "brief") renderBrief();
  if (id === "handoff") renderHandoff();
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-goto]");
  if (!b) return;
  const id = b.dataset.goto;
  if (id === "brief" && !state.brief) state.brief = makeBrief();
  if (id === "handoff") state.handoff = state.handoff || makeHandoff();
  show(id);
});

/* ---------- 1. report ---------- */
const sel = $("#scenario");
sel.innerHTML = SCENARIO_LIST.map((s) => `<option value="${s.id}">${esc(s.id)} · ${esc(s.bins)}</option>`).join("");

function previewReport() {
  const s = sc(getScenario(sel.value));
  $("#report-preview").innerHTML = `
    <h4>${esc(s.customer)}</h4>
    <p class="mono" style="font-size:.8rem;color:var(--ink-3)">${esc(s.phone)}</p>
    <p style="margin-top:10px">${esc(s.reported)}</p>
    <p style="font-size:.82rem;color:var(--ink-3)"><strong style="color:var(--ink)">${esc(t("start.prior"))}:</strong> ${s.prevVisits.length ? s.prevVisits.map((v) => esc(v.id)).join(", ") : esc(t("start.none"))}</p>
    <p style="font-size:.82rem;color:var(--ink-3)"><strong style="color:var(--ink)">${esc(t("start.line"))}:</strong> ${esc(s.line.label)}</p>`;
}
sel.addEventListener("change", previewReport);

$("#report-form").addEventListener("submit", (e) => {
  e.preventDefault();
  state.scenarioId = sel.value;
  state.answers = {};
  state.profile = {
    repeats: document.querySelector('input[name="repeats"]:checked').value,
    tries: document.querySelector('input[name="tries"]:checked').value,
    field: $("#field").value.trim(),
  };
  state.brief = null;
  state.handoff = null;
  renderChecks();
  show("checks");
});

/* ---------- 2. checks ---------- */
const checkText = (c) => {
  const m = isMs() && MS_CHECK_LABEL_DETAIL[c.id];
  return { label: m?.label ?? c.label, detail: m?.detail ?? c.detail };
};
const optionText = (c, o) => (isMs() && MS_OPTION[c.id]?.[o.v]) || o.label;
const whyText = (id, v) => (isMs() ? MS_WHY : WHY)[id][v];

function renderChecks() {
  $("#checklist").innerHTML = CHECKS.map((c) => {
    const { label, detail } = checkText(c);
    return `
    <div class="check" data-check="${c.id}">
      <div>
        <div class="check-label">${esc(label)}</div>
        <p class="check-detail">${esc(detail)}</p>
      </div>
      <div>
        <div class="seg" role="group" aria-label="${esc(label)}">
          ${c.options.map((o) => `<button type="button" data-check="${c.id}" data-val="${o.v}" aria-pressed="${state.answers[c.id] === o.v}">${esc(optionText(c, o))}</button>`).join("")}
        </div>
        <p class="why" data-why="${c.id}" ${state.answers[c.id] ? "" : "hidden"}>${state.answers[c.id] ? esc(whyText(c.id, state.answers[c.id])) : ""}</p>
      </div>
    </div>`;
  }).join("");
}

$("#checklist").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-check]");
  if (!b) return;
  const { check, val } = b.dataset;
  // Clicking the active option clears it, so a gap can be reopened.
  state.answers[check] = state.answers[check] === val ? null : val;
  if (!state.answers[check]) delete state.answers[check];
  document.querySelectorAll(`button[data-check="${check}"]`).forEach((x) =>
    x.setAttribute("aria-pressed", String(state.answers[check] === x.dataset.val)));
  const why = document.querySelector(`[data-why="${check}"]`);
  why.textContent = state.answers[check] ? whyText(check, state.answers[check]) : "";
  why.hidden = !state.answers[check];
  state.brief = null;
  state.handoff = null;
});

const loadPreset = (answers) => {
  state.answers = { ...answers };
  state.brief = null;
  renderChecks();
  show("checks");
};
$("#preset-nff").addEventListener("click", () => {
  state.profile = { ...state.profile, repeats: "yes", tries: "many" };
  loadPreset({ speed_at_router: "n", line_status: "up", router_light: "red", wifi_pattern: "nt" });
});
$("#preset-clean").addEventListener("click", () => {
  state.profile = { ...state.profile, repeats: "unknown" };
  loadPreset({ speed_at_router: "y", line_status: "up", router_light: "green", wifi_pattern: "y" });
});

$("#to-brief").addEventListener("click", () => {
  state.brief = makeBrief();
  state.handoff = null;
  show("brief");
});

/* ---------- 3. brief ---------- */
const makeBrief = () => buildBrief(getScenario(state.scenarioId), state.answers, state.profile, {
  technician: "",
  visitId: "VIS-" + String(Math.floor(Math.random() * 9000) + 1000),
});

const CONF_KEY = { Ready: "conf.Ready", "Workable, one gap": "conf.Workable", Incomplete: "conf.Incomplete" };

function renderBrief() {
  const b = state.brief || makeBrief();
  state.brief = b;
  b.scenario = sc(b.scenario);
  const s = b.scenario;
  $("#brief-id").textContent = `${b.meta.visitId} · ${s.id}`;
  $("#confidence").textContent = t(CONF_KEY[b.confidence] || "conf.Incomplete");
  $("#confidence").dataset.level = b.confidence;
  $("#brief-customer").textContent = s.customer;
  $("#brief-window").textContent = s.windows;
  $("#b-address").textContent = s.address;
  $("#b-line").textContent = `${s.line.label} · ${s.line.olt} ${s.line.port}`;
  $("#b-access").textContent = s.accessNotes;

  $("#b-findings").innerHTML = b.findings.length
    ? b.findings.map((f) => `
      <div class="finding">
        <div class="finding-head"><span class="level" data-level="${f.level}">${esc(t("level." + f.level))}</span><span class="finding-title">${esc(f.copy.title || f.key)}</span></div>
        <p class="finding-note">${esc(f.copy.note)}</p>
        <ul class="because">${f.copy.because.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>`).join("")
    : `<p style="color:var(--ink-2);font-size:.88rem">${esc(t("brief.noChecks"))}</p>`;

  const d = b.diagnosis;
  const dLabel = d ? d.copy.label : "";
  const dSkill = d ? d.copy.skill : "";
  const gaps = b.unresolved.map((u) => (isMs() && MS_UNRESOLVED[u]) || u);
  $("#b-diagnosis").innerHTML = d ? `
    <div class="diag">
      <div class="diag-label">${esc(dLabel)}</div>
      <div class="diag-meta">
        <span>${esc(t("brief.skill"))}: <strong>${esc(dSkill)}</strong></span>
        <span>${d.noVisit ? esc(t("brief.noVisit")) : `${esc(t("brief.estimate"))}: <strong class="mono">${d.min}${isMs() ? " hingga " : "–"}${d.max} min</strong>`}</span>
      </div>
    </div>
    <p class="estimate-note">${esc(d.noVisit ? t("brief.selfFix") : t("brief.estimateNote"))} ${esc(t("brief.ranked", { n: b.findings.length }))}</p>
    ${b.alternatives.length ? `<div class="alts">${esc(t("brief.alts"))}<ul>${b.alternatives.map((x) => `<li>${esc(x.copy.label)}</li>`).join("")}</ul></div>` : ""}
  ` : `<div class="diag-none">${esc(t("brief.noDiag"))} ${gaps.length ? esc(t("brief.unanswered", { list: gaps.join(", ") })) : ""}</div>`;

  $("#b-agenda").innerHTML = b.agenda.map((x) => `<li><div><b>${esc(x.title)}</b><span>${esc(x.detail)}</span></div></li>`).join("");
  $("#b-safety").innerHTML = s.safety.map((x) => `<li>${esc(x)}</li>`).join("");
  $("#b-parts").innerHTML = d && d.copy.parts.length ? d.copy.parts.map((x) => `<li>${esc(x)}</li>`).join("") : `<li>${esc(t("brief.noParts"))}</li>`;
  $("#b-estimate").textContent = d && !d.noVisit ? t("brief.estLine", { min: d.min, max: d.max }) : "";
  $("#b-gaps").innerHTML = gaps.length
    ? gaps.map((x) => `<li>${esc(x)}</li>`).join("")
    : `<li style="color:var(--ok)">${esc(t("brief.noGaps"))}</li>`;
  $("#b-neighbours").innerHTML = s.customers.map((c) => `<tr><td>${esc(c.name)}</td><td class="mono">${esc(c.line)}</td><td>${esc(c.note)}</td></tr>`).join("");
  $("#b-prior").innerHTML = s.prevVisits.length
    ? s.prevVisits.map((v) => `<li><span class="mono" style="color:var(--ink-3);font-size:.78rem">${esc(v.id)} · ${v.daysAgo}d</span><br>${esc(v.found)}</li>`).join("")
    : `<li>${esc(t("brief.noPrior"))}</li>`;
}

/* ---------- 4. handoff ---------- */
function makeHandoff() {
  const b = state.brief || makeBrief();
  state.brief = b;
  const v = {
    outcome: (document.querySelector('input[name="outcome"]:checked') || {}).value || "",
    defect: $("#defect").value.trim(),
    parts: $("#parts").value.trim(),
    followup: $("#followup").value.trim(),
  };
  return buildHandoff(b, v);
}

function renderHandoff() {
  const h = makeHandoff();
  state.handoff = h;
  const b = h.brief;
  const gap = (label, v) => v
    ? `<div class="handoff-row"><span class="handoff-key">${esc(label)}</span><span class="handoff-val">${esc(v)}</span></div>`
    : `<div class="handoff-row"><span class="handoff-key">${esc(label)}</span><span class="handoff-val open">${esc(t("handoff.notRecorded"))}</span></div>`;
  $("#handoff-preview").innerHTML = `
    <h4>${esc(b.scenario.customer)} · ${esc(b.meta.visitId)}</h4>
    <p style="font-size:.84rem">${esc(h.explanation)}</p>
    <div style="margin-top:12px">
      ${gap(t("handoff.defectLbl"), h.defect)}
      ${gap(t("handoff.partsLbl"), h.needed)}
      ${gap(t("handoff.nextLbl"), h.visit.followup)}
    </div>
    <p style="margin-top:12px;font-size:.8rem;color:var(--ink-3)">${esc(h.reuse)}</p>
    <p style="margin-top:10px;font-size:.8rem;color:var(--ink-3)">${esc(t("handoff.carried", { n: b.findings.length, m: b.unresolved.length }))}</p>`;
}
["defect", "parts", "followup"].forEach((id) => $("#" + id).addEventListener("input", () => { if (state.view === "handoff") renderHandoff(); }));
document.querySelectorAll('input[name="outcome"]').forEach((r) => r.addEventListener("change", () => { if (state.view === "handoff") renderHandoff(); }));

/* ---------- export ---------- */
const briefText = (b) => {
  const d = b.diagnosis;
  const s = b.scenario;
  const gaps = b.unresolved.map((u) => (isMs() && MS_UNRESOLVED[u]) || u);
  return [
    `LINECHECK · ${b.meta.visitId} · ${s.id}`,
    `${isMs() ? "Pelanggan" : "Customer"}: ${s.customer}`,
    `${t("brief.address")}: ${s.address}`,
    `${isMs() ? "Tetingkap" : "Window"}: ${s.windows}`,
    `${t("brief.line")}: ${s.line.label} · ${s.line.olt} ${s.line.port}`,
    `${isMs() ? "Keyakinan" : "Confidence"}: ${t(CONF_KEY[b.confidence])}`,
    "",
    t("brief.access").toUpperCase(), s.accessNotes,
    "",
    t("brief.safety").toUpperCase(), ...s.safety.map((x) => "- " + x),
    "",
    t("brief.known").toUpperCase(),
    ...(b.findings.length
      ? b.findings.flatMap((f) => [`${t("level." + f.level).toUpperCase()} · ${f.copy.title || f.key}`, "  " + f.copy.note, ...f.copy.because.map((x) => "  · " + x)])
      : ["- " + t("brief.noChecks")]),
    "",
    t("brief.diagnosis").toUpperCase(),
    d ? `${d.copy.label} · ${d.copy.skill} · ${d.noVisit ? t("brief.noVisit") : d.min + (isMs() ? " hingga " : "–") + d.max + " min"}` : t("brief.noDiag"),
    ...(b.alternatives.length ? [t("brief.alts") + " " + b.alternatives.map((x) => x.copy.label).join("; ")] : []),
    "",
    t("brief.agenda").toUpperCase(), ...b.agenda.map((x, i) => `${i + 1}. ${x.title}: ${x.detail}`),
    "",
    t("brief.gaps").toUpperCase(), ...(gaps.length ? gaps.map((x) => "- " + x) : ["- " + t("brief.noGaps")]),
    "",
    t("brief.parts").toUpperCase(), ...(d && d.copy.parts.length ? d.copy.parts.map((x) => "- " + x) : ["- " + t("brief.noParts")]),
    "",
    t("foot.synth"),
  ].join("\n");
};

const handoffText = (h) => {
  const gaps = h.brief.unresolved.map((u) => (isMs() && MS_UNRESOLVED[u]) || u);
  return [
    `LINECHECK · ${h.brief.meta.visitId} · ${h.brief.scenario.id}`,
    h.brief.scenario.customer,
    `${t("handoff.outcome")}: ${h.explanation}`,
    `${t("handoff.defectLbl")}: ${h.defect || t("handoff.notRecorded")}`,
    `${t("handoff.partsLbl")}: ${h.needed || t("handoff.notRecorded")}`,
    `${t("handoff.nextLbl")}: ${h.visit.followup || t("handoff.notRecorded")}`,
    h.reuse,
    "",
    t("brief.gaps").toUpperCase(), ...(gaps.length ? gaps.map((x) => "- " + x) : ["- " + t("brief.noGaps")]),
  ].join("\n");
};

async function copy(text, btn) {
  const old = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = isMs() ? "Disalin" : "Copied";
  } catch {
    btn.textContent = isMs() ? "Salin di tetingkap" : "Copy in prompt";
    window.prompt(isMs() ? "Salin teks ini" : "Copy this text", text);
  }
  setTimeout(() => { btn.textContent = old; }, 1400);
}

$("#copy-brief").addEventListener("click", (e) => copy(briefText(state.brief || makeBrief()), e.currentTarget));
$("#copy-handoff").addEventListener("click", (e) => copy(handoffText(state.handoff || makeHandoff()), e.currentTarget));

function printView(id) {
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("is-print", v.id === id));
  window.print();
  setTimeout(() => document.querySelectorAll(".view").forEach((v) => v.classList.remove("is-print")), 300);
}
$("#print-brief").addEventListener("click", () => printView("brief"));
$("#print-handoff").addEventListener("click", () => printView("handoff"));

$("#reset").addEventListener("click", () => {
  state.answers = {}; state.brief = null; state.handoff = null;
  $("#visit-form").reset(); $("#field").value = "";
  renderChecks(); previewReport(); show("start");
});

/* ---------- method dialog ---------- */
const dlg = $("#method");
$("#open-method").addEventListener("click", (e) => { e.preventDefault(); dlg.showModal(); });
$("#close-method").addEventListener("click", () => dlg.close());

/* ---------- theme ---------- */
const themeBtn = $("#theme-toggle");
const applyTheme = (mode) => {
  document.documentElement.dataset.theme = mode;
  themeBtn.setAttribute("aria-label", (mode === "dark" ? "Switch to light" : "Switch to dark") + " / " + (mode === "dark" ? "Tukar ke cerah" : "Tukar ke gelap"));
};
applyTheme(document.documentElement.dataset.theme || "light");
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("linecheck-theme", next);
});

/* ---------- language ---------- */
// Re-renders everything that carries text. State is kept, so switching
// language mid-workflow does not lose answers or the current brief.
function applyLang(code) {
  setLang(code);
  document.documentElement.lang = code === "ms" ? "ms" : "en";
  localStorage.setItem("linecheck-lang", code);
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === code)));
  // Placeholders live outside the text pass.
  $("#field").placeholder = t("start.wordsPh");
  $("#defect").placeholder = t("handoff.defectPh");
  $("#parts").placeholder = t("handoff.partsPh");
  $("#followup").placeholder = t("handoff.followupPh");
  // The brief already holds a generated scenario; rebuild it in the new language.
  if (state.brief) state.brief = makeBrief();
  renderChecks();
  previewReport();
  if (state.view === "brief") renderBrief();
  if (state.view === "handoff") renderHandoff();
}

document.querySelectorAll("[data-lang]").forEach((b) =>
  b.addEventListener("click", () => applyLang(b.dataset.lang)));

/* ---------- init ---------- */
const browserMs = (navigator.language || "").toLowerCase().startsWith("ms");
applyLang(localStorage.getItem("linecheck-lang") || (browserMs ? "ms" : "en"));
show("start");
