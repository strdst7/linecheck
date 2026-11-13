/* Self-check. Run: node engine.test.mjs
   Fails loudly if the engine asserts a cause the evidence does not support. */
import { getScenario } from "./scenarios.js";
import { buildBrief, buildHandoff, rank } from "./engine.js";
import { setLang, t, STRINGS } from "./i18n.js";

let pass = 0;
const ok = (cond, msg) => { if (!cond) throw new Error("FAIL: " + msg); pass++; };

const noAns = { repeats: "unknown", tries: "none", field: "" };
const answered = { speed_at_router: "n", line_status: "up", router_light: "red", wifi_pattern: "nt" };

// 1. A brief with no answers must not claim a diagnosis.
{
  const s = getScenario("S-4471");
  const b = buildBrief(s, {}, noAns, { technician: "A. Raj", visitId: "T-1" });
  ok(b.confidence === "Incomplete", "empty answers -> Incomplete, got " + b.confidence);
  ok(b.diagnosis === null, "empty answers -> no diagnosis");
  ok(b.unresolved.length >= 3, "empty answers -> gaps listed");
}

// 1b. One answer is not enough to call a brief workable.
{
  const b = buildBrief(getScenario("S-4471"), { speed_at_router: "n" }, noAns, {});
  ok(b.confidence === "Incomplete", "single answer -> Incomplete, got " + b.confidence);
}

// 2. Slow at router must surface the peak-hour gap and a line-side diagnosis.
{
  const s = getScenario("S-1180");
  const b = buildBrief(s, answered, { ...noAns, repeats: "yes", tries: "many" }, {});
  ok(b.diagnosis !== null, "answered -> diagnosis present");
  ok(b.diagnosis.score > 0, "diagnosis has support");
  ok(b.agenda.some((x) => /previous visit/i.test(x.title)), "prior visit reviewed first");
  ok(b.findings.some((f) => f.key === "repeat_nff"), "repeat NFF flagged");
  ok(b.findings.some((f) => f.key === "shared_leg"), "neighbour evidence pulled in");
  ok(b.findings.some((f) => f.key === "self_fix_exhausted"), "customer tries respected");
  const allHaveEvidence = b.findings.every((f) => f.because.length > 0);
  ok(allHaveEvidence, "every finding cites evidence");
}

// 3. Wi-Fi-only on a clean line must not be diagnosed as a drop fault.
{
  const s = getScenario("S-7734");
  const b = buildBrief(s, { speed_at_router: "y", line_status: "up", router_light: "green", wifi_pattern: "y" }, { ...noAns, field: "back room is bad" }, {});
  ok(b.diagnosis && b.diagnosis.key === "wifi_coverage", "clean line -> wifi coverage first, got " + (b.diagnosis && b.diagnosis.key));
  ok(!b.agenda.some((x) => /speed at the router/i.test(x.title)), "no speed test demanded when already fine");
}

// 4. Ranking excludes no-visit diagnoses when the line is still in doubt.
{
  const s = getScenario("S-2290");
  const r = rank(s, { speed_at_router: "n", line_status: "down", router_light: "red", wifi_pattern: "nt" });
  ok(r.top && !r.top.noVisit, "unmeasured line -> top diagnosis needs a visit");
}

// 4b. A clean line with a fine router must never blame the drop.
{
  const s = getScenario("S-7734");
  const r = rank(s, { speed_at_router: "y", line_status: "up", router_light: "green", wifi_pattern: "y" });
  ok(r.top && r.top.skill === "Customer self-fix", "clean line -> self-fix diagnosis");
  ok(!r.rest.some((d) => d.key === "drop_cable"), "clean line -> drop cable not mentioned");
}

// 5. Handoff keeps the evidence and states the outcome plainly.
{
  const b = buildBrief(getScenario("S-4471"), answered, noAns, {});
  const h = buildHandoff(b, { outcome: "pending", defect: "Perished entry sleeve", parts: "2-pair drop cable, 8 m" });
  ok(/second appointment|network-side/i.test(h.explanation), "pending handoff states the next step");
  ok(h.brief.findings.length > 0, "handoff carries findings");
}

// 6. Malay must translate the same decisions, not re-decide them.
{
  const s = getScenario("S-1180");
  const enRaw = buildBrief(s, answered, { ...noAns, repeats: "yes" }, {});
  const en = { diagnosis: { ...enRaw.diagnosis, copy: { ...enRaw.diagnosis.copy } }, confidence: enRaw.confidence,
    findings: enRaw.findings.map((f) => ({ ...f, copy: { ...f.copy } })) };
  setLang("ms");
  const ms = buildBrief(s, answered, { ...noAns, repeats: "yes" }, {});
  ok(ms.diagnosis.key === en.diagnosis.key, "language must not change the diagnosis");
  ok(ms.confidence === en.confidence, "language must not change confidence");
  ok(ms.findings.map((f) => f.key).join() === en.findings.map((f) => f.key).join(), "same findings in both languages");
  ok(ms.diagnosis.copy.label !== en.diagnosis.copy.label, "diagnosis label is actually translated");
  ok(ms.findings.every((f) => f.copy.note), "every finding has localised copy");
  // BM uses no diacritics, so compare against the English string rather than a charset test.
  ok(ms.findings[0].copy.note !== en.findings[0].copy.note, "Malay finding note differs from English");
  // Machine-built evidence lines leaked English once; assert none survive.
  const englishLeaks = ms.findings.flatMap((f) => f.copy.because)
    .filter((b) => /days ago|billed no fault|Provisioned on|speed at router|line status: down/i.test(b));
  ok(englishLeaks.length === 0, "untranslated evidence: " + englishLeaks.join("; "));
  ok(ms.findings.some((f) => f.key === "shared_leg"), "neighbour rule still fires in Malay");
  const h = buildHandoff(ms, { outcome: "pending" });
  ok(h.explanation === STRINGS.ms["expl.pending"], "handoff explanation translated");
  ok(h.defect === "", "unrecorded defect is empty, not a fake string");
  setLang("en");
}

// 7. Every key used by the app exists in both languages.
{
  const missing = Object.keys(STRINGS.en).filter((k) => !(k in STRINGS.ms));
  ok(missing.length === 0, "missing Malay keys: " + missing.join(", "));
  const extra = Object.keys(STRINGS.ms).filter((k) => !(k in STRINGS.en));
  ok(extra.length === 0, "Malay keys with no English twin: " + extra.join(", "));
  ok(t("conf.Ready") === "Ready", "default language is English");
  setLang("zz");
  ok(t("conf.Ready") === "Ready", "unknown language falls back to English");
  setLang("en");
}

console.log(`engine self-check: ${pass} assertions passed`);
