import { SCENARIO_LIST, getScenario } from "./scenarios.js";
import { CHECKS, WHY } from "./checks.js";
import { buildBrief, buildHandoff } from "./engine.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const state = {
  scenarioId: SCENARIO_LIST[0].id,
  answers: {},
  profile: { repeats: "unknown", tries: "none", field: "" },
  brief: null,
  handoff: null,
};

/* ---------- navigation ---------- */
function show(id) {
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
  const s = getScenario(sel.value);
  $("#report-preview").innerHTML = `
    <h4>${esc(s.customer)}</h4>
    <p class="mono" style="font-size:.8rem;color:var(--ink-3)">${esc(s.phone)}</p>
    <p style="margin-top:10px">${esc(s.report.reported)}</p>
    <p style="font-size:.82rem;color:var(--ink-3)"><strong style="color:var(--ink)">Prior visits:</strong> ${s.prevVisits.length ? s.prevVisits.map((v) => esc(v.id)).join(", ") : "none"}</p>
    <p style="font-size:.82rem;color:var(--ink-3)"><strong style="color:var(--ink)">Line:</strong> ${esc(s.line.label)}</p>`;
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
function renderChecks() {
  $("#checklist").innerHTML = CHECKS.map((c) => `
    <div class="check" data-check="${c.id}">
      <div>
        <div class="check-label">${esc(c.label)}</div>
        <p class="check-detail">${esc(c.detail)}</p>
      </div>
      <div>
        <div class="seg" role="group" aria-label="${esc(c.label)}">
          ${c.options.map((o) => `<button type="button" data-check="${c.id}" data-val="${o.v}" aria-pressed="${state.answers[c.id] === o.v}">${esc(o.label)}</button>`).join("")}
        </div>
        <p class="why" data-why="${c.id}" ${state.answers[c.id] ? "" : "hidden"}>${state.answers[c.id] ? esc(WHY[c.id][state.answers[c.id]]) : ""}</p>
      </div>
    </div>`).join("");
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
  why.textContent = state.answers[check] ? WHY[check][state.answers[check]] : "";
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
  technician: "Field technician (unassigned)",
  visitId: "VIS-" + String(Math.floor(Math.random() * 9000) + 1000),
});

const LEVEL_WORD = { high: "strong", medium: "likely", low: "weak", info: "note" };

function renderBrief() {
  const b = state.brief || makeBrief();
  state.brief = b;
  const s = b.scenario;
  $("#brief-id").textContent = `${b.meta.visitId} · report ${s.id}`;
  $("#confidence").textContent = b.confidence;
  $("#confidence").dataset.level = b.confidence;
  $("#brief-customer").textContent = s.customer;
  $("#brief-window").textContent = `Appointment window ${s.windows}. ${s.prevVisits.length ? `${s.prevVisits.length} prior visit${s.prevVisits.length > 1 ? "s" : ""} on record.` : "No prior visit on record."}`;
  $("#b-address").textContent = s.address;
  $("#b-line").textContent = `${s.line.label} · ${s.line.olt} ${s.line.port}`;
  $("#b-access").textContent = s.accessNotes;

  $("#b-findings").innerHTML = b.findings.length
    ? b.findings.map((f) => `
      <div class="finding">
        <div class="finding-head"><span class="level" data-level="${f.level}">${LEVEL_WORD[f.level]}</span><span class="finding-title">${esc(FINDING_TITLES[f.key] || f.key)}</span></div>
        <p class="finding-note">${esc(f.note)}</p>
        <ul class="because">${f.because.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>`).join("")
    : `<p style="color:var(--ink-2);font-size:.88rem">No checks answered. Nothing here is a finding yet. Answer the checks and the evidence appears with each one.</p>`;

  const d = b.diagnosis;
  $("#b-diagnosis").innerHTML = d ? `
    <div class="diag">
      <div class="diag-label">${esc(d.label)}</div>
      <div class="diag-meta">
        <span>Skill: <strong>${esc(d.skill)}</strong></span>
        <span>${d.noVisit ? "No visit proposed" : `Estimate: <strong class="mono">${d.min} to ${d.max} min</strong>`}</span>
      </div>
    </div>
    <p class="estimate-note">${d.noVisit ? "The evidence points inside the home. Close as a self-fix task before booking a technician." : "On-site time estimate, not a quote."} Ranked first across ${b.findings.length} finding${b.findings.length === 1 ? "" : "s"}.</p>
    ${b.alternatives.length ? `<div class="alts">Also possible, lower in the evidence:<ul>${b.alternatives.map((x) => `<li>${esc(x.label)}</li>`).join("")}</ul></div>` : ""}
  ` : `<div class="diag-none">No supported diagnosis yet. ${b.unresolved.length ? "Unanswered: " + esc(b.unresolved.join(", ")) + "." : ""}</div>`;

  $("#b-agenda").innerHTML = b.agenda.map((x) => `<li><div><b>${esc(x.title)}</b><span>${esc(x.detail)}</span></div></li>`).join("");
  $("#b-safety").innerHTML = s.safety.map((x) => `<li>${esc(x)}</li>`).join("");
  $("#b-parts").innerHTML = d && d.parts.length ? d.parts.map((x) => `<li>${esc(x)}</li>`).join("") : `<li>No parts implied by the current evidence.</li>`;
  $("#b-estimate").textContent = d && !d.noVisit ? `Time ${d.min} to ${d.max} min · parts as listed · estimate only` : "";
  $("#b-gaps").innerHTML = b.unresolved.length
    ? b.unresolved.map((x) => `<li>${esc(x)}</li>`).join("")
    : `<li style="color:var(--ok)">Line and router both measured. Nothing outstanding before the visit.</li>`;
  $("#b-neighbours").innerHTML = s.customers.map((c) => `<tr><td>${esc(c.name)}</td><td class="mono">${esc(c.line)}</td><td>${esc(c.note)}</td></tr>`).join("");
  $("#b-prior").innerHTML = s.prevVisits.length
    ? s.prevVisits.map((v) => `<li><span class="mono" style="color:var(--ink-3);font-size:.78rem">${esc(v.id)} · ${v.daysAgo}d</span><br>${esc(v.found)}</li>`).join("")
    : `<li>No prior visit on this line.</li>`;
}

const FINDING_TITLES = {
  line_down: "Line is down",
  power: "No power to the router",
  swap_already: "Hardware already swapped",
  repeat_nff: "Repeat no-fault-found visits",
  line_shortfall: "Line is short of the plan",
  wifi_inside: "Fault is inside the home",
  recurring_clean: "Recurring fault, clean at test time",
  no_peak_test: "No peak-hour measurement",
  shared_leg: "Neighbours on the shared leg report it too",
  recurring_first_time: "First documented recurrence",
  self_fix_exhausted: "Customer already tried the basics",
};

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
  const gap = (label, v) => v ? `<div class="handoff-row"><span class="handoff-key">${esc(label)}</span><span class="handoff-val">${esc(v)}</span></div>`
    : `<div class="handoff-row"><span class="handoff-key">${esc(label)}</span><span class="handoff-val open">not recorded</span></div>`;
  $("#handoff-preview").innerHTML = `
    <h4>${esc(b.scenario.customer)} · ${esc(b.meta.visitId)}</h4>
    <p style="font-size:.84rem">${esc(h.explanation)}</p>
    <div style="margin-top:12px">
      ${gap("Defect", h.defect === "not recorded" ? "" : h.defect)}
      ${gap("Parts", h.needed === "not recorded" ? "" : h.needed)}
      ${gap("Next step", h.visit.followup)}
    </div>
    <p style="margin-top:12px;font-size:.8rem;color:var(--ink-3)">${esc(h.reuse)}</p>
    <p style="margin-top:10px;font-size:.8rem;color:var(--ink-3)">Carried forward: ${b.findings.length} finding${b.findings.length === 1 ? "" : "s"} with evidence, ${b.unresolved.length} open item${b.unresolved.length === 1 ? "" : "s"}.</p>`;
}
["defect", "parts", "followup"].forEach((id) => $("#" + id).addEventListener("input", () => { if (!$("#handoff").hidden) renderHandoff(); }));
document.querySelectorAll('input[name="outcome"]').forEach((r) => r.addEventListener("change", () => { if (!$("#handoff").hidden) renderHandoff(); }));

/* ---------- export ---------- */
const briefText = (b) => {
  const d = b.diagnosis;
  return [
    `LINECHECK BRIEF · ${b.meta.visitId} · report ${b.scenario.id} (synthetic scenario)`,
    `Customer: ${b.scenario.customer}`,
    `Address: ${b.scenario.address}`,
    `Window: ${b.scenario.windows}`,
    `Line: ${b.scenario.line.label} · ${b.scenario.line.olt} ${b.scenario.line.port}`,
    `Confidence: ${b.confidence}`,
    "",
    "ACCESS", b.scenario.accessNotes,
    "",
    "SAFETY", ...b.scenario.safety.map((x) => "- " + x),
    "",
    "FINDINGS",
    ...(b.findings.length ? b.findings.flatMap((f) => [`[${f.level}] ${FINDING_TITLES[f.key] || f.key}`, "  " + f.note, ...f.because.map((x) => "  evidence: " + x)]) : ["- none, no checks answered"]),
    "",
    "LEAD DIAGNOSIS", d ? `${d.label} · ${d.skill} · ${d.noVisit ? "no visit" : d.min + " to " + d.max + " min (estimate)"}` : "none yet",
    ...(b.alternatives.length ? ["Also possible: " + b.alternatives.map((x) => x.label).join("; ")] : []),
    "",
    "AGENDA", ...b.agenda.map((x, i) => `${i + 1}. ${x.title}: ${x.detail}`),
    "",
    "NOT ESTABLISHED", ...(b.unresolved.length ? b.unresolved.map((x) => "- " + x) : ["- none"]),
    "",
    "PARTS", ...(d && d.parts.length ? d.parts.map((x) => "- " + x) : ["- none implied"]),
    "",
    "This brief is generated from synthetic data. Time and parts are estimates.",
  ].join("\n");
};

const handoffText = (h) => [
  `LINECHECK HANDOFF · ${h.brief.meta.visitId} · ${h.brief.scenario.id} (synthetic scenario)`,
  `Customer: ${h.brief.scenario.customer}`,
  `Outcome: ${h.explanation}`,
  `Defect: ${h.defect}`,
  `Parts: ${h.needed}`,
  `Next step: ${h.visit.followup || "not recorded"}`,
  `Reuse: ${h.reuse}`,
  "",
  "Open items",
  ...(h.brief.unresolved.length ? h.brief.unresolved.map((x) => "- " + x) : ["- none"]),
].join("\n");

async function copy(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const old = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => { btn.textContent = old; }, 1400);
  } catch {
    window.prompt("Copy this text", text);
  }
}

$("#copy-brief").addEventListener("click", (e) => copy(briefText(state.brief || makeBrief()), e.currentTarget));
$("#copy-handoff").addEventListener("click", (e) => copy(handoffText(state.handoff || makeHandoff()), e.currentTarget));

function printView(id, btn) {
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("is-print", v.id === id));
  window.print();
  setTimeout(() => document.querySelectorAll(".view").forEach((v) => v.classList.remove("is-print")), 300);
}
$("#print-brief").addEventListener("click", () => printView("brief"));
$("#print-handoff").addEventListener("click", () => printView("handoff", $("#print-handoff")));

$("#reset").addEventListener("click", () => {
  state.answers = {}; state.brief = null; state.handoff = null;
  $("#visit-form").reset(); $("#field").value = "";
  renderChecks(); previewReport(); show("start");
});

/* ---------- method dialog ---------- */
const dlg = $("#method");
$("#open-method").addEventListener("click", (e) => { e.preventDefault(); dlg.showModal(); });
$("#close-method").addEventListener("click", () => dlg.close());

/* ---------- init ---------- */
previewReport();
renderChecks();
show("start");
