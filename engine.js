/* Fault -> brief engine.
   Pure functions, no DOM, no network. Each finding carries `because`
   (a list of concrete evidence strings) so the brief never asserts a
   cause without showing what pointed at it.

   `profile` is the customer's trial report: { repeats, tries, field }
   where field is a free-text line the customer wrote. Nothing here
   treats that text as verified. */
import { DIAGNOSES } from "./scenarios.js";
import { t, getLang } from "./i18n.js";
import { MS_DIAGNOSES, MS_FINDING, MS_FINDING_BECAUSE, MS_AGENDA, MS_UNRESOLVED, MS_NEIGHBOUR_NOTE } from "./ms.js";

// Localise a finding: keys are stable, copy comes from i18n.js, with the
// Malay bundle in ms.js standing in for the long-form evidence strings.
const findingCopy = (f) => getLang() === "ms" && MS_FINDING[f.key]
  ? { title: MS_FINDING[f.key].title, note: MS_FINDING[f.key].note,
      because: f.because.map((b) => MS_FINDING_BECAUSE[b] || b) }
  : { title: null, note: f.note, because: f.because };

const diagCopy = (key, base) => getLang() === "ms" && MS_DIAGNOSES[key]
  ? { label: MS_DIAGNOSES[key].label, skill: MS_DIAGNOSES[key].skill, parts: MS_DIAGNOSES[key].parts }
  : { label: base.label, skill: base.skill, parts: base.parts };

const P = (ans, k) => (ans && ans[k]) || null;

/* ---------- findings ----------
   Each rule returns { key, level, weight, because[] } or null.
   level: "high" | "medium" | "low" | "info"
   weight is only used to order the visit agenda, never shown raw. */

export function findings(scenario, answers, profile) {
  const a = answers || {};
  const out = [];
  const speed = P(a, "speed_at_router");
  const line = P(a, "line_status");
  const light = P(a, "router_light");
  const wifi = P(a, "wifi_pattern");
  const nff = scenario.prevVisits.filter((v) => v.conclusion === "NFF");
  const swaps = scenario.prevVisits.filter((v) => v.conclusion === "hardware swap");
  // Match both languages: the rule must fire in Malay too, so it tests the
  // raw English note OR its Malay translation.
  const neighboursComplain = scenario.customers.filter((c) =>
    /evening|same as|slow|video call|petang|perlahan|sama seperti/i.test(c.note));

  if (line === "down") {
    out.push({ key: "line_down", level: "high", weight: 10,
      because: ["Line status: down (checked from the access network at visit time)"],
      note: "A down line rules out an in-home cause until the line is restored." });
  }

  if (light === "off") {
    out.push({ key: "power", level: "high", weight: 9,
      because: ["Router indicator: off / no power"],
      note: "Check power and the adapter before anything else. This is the cheapest explanation and the most common." });
  }

  if (swaps.length && light !== "off") {
    out.push({ key: "swap_already", level: "medium", weight: 5,
      because: swaps.map((v) => `${v.id}: ${t("ev.swap", { d: v.daysAgo })}`),
      note: "Hardware was already swapped and the fault returned. Do not swap the same model again without new evidence." });
  }

  if (nff.length && light !== "off") {
    out.push({ key: "repeat_nff", level: "high", weight: 8,
      because: nff.map((v) => `${v.id}: ${t("ev.nff", { d: v.daysAgo })}`),
      note: "Repeat no-fault-found visits. Treat the previous conclusion as a suspect, not as proof. Take the measurement the prior visit skipped." });
  }

  if (speed === "n" && light !== "off") {
    out.push({ key: "line_shortfall", level: "high", weight: 8,
      because: ["Speed at the router is below the plan during the busy hour",
        scenario.line.type === "FTTH" ? t("ev.provisioned", { olt: scenario.line.olt, port: scenario.line.port }) : t("ev.profile")],
      note: "Slow at the router means the line, the drop, or the shared leg, not the in-home network." });
  }

  if (speed === "y" && (wifi === "y" || /back room|wifi|wi-fi|wireless|coverage/i.test(profile.field || ""))) {
    out.push({ key: "wifi_inside", level: "medium", weight: 6,
      because: [
        "Speed at the router is fine",
        wifi === "y" ? "Cable fine, Wi-Fi poor" : "Customer describes trouble away from the router",
      ],
      note: "Line is delivering. The problem is between the router and the device." });
  }

  if (speed === "y" && profile.repeats === "yes") {
    out.push({ key: "recurring_clean", level: "medium", weight: 5,
      because: ["Speed at the router is fine on every test so far", "Customer reports the fault keeps coming back"],
      note: "A recurring fault that is clean at visit time needs a time-of-day test, not another cable swap." });
  }

  if (speed === "nt") {
    out.push({ key: "no_peak_test", level: "medium", weight: 7,
      because: ["Speed at the router: not tested, or off-peak only"],
      note: "Test during the customer's busy hour before writing any conclusion. An off-peak test cannot close a peak-hour fault." });
  }

  if (speed === "n" && neighboursComplain.length) {
    out.push({ key: "shared_leg", level: "medium", weight: 5,
      because: neighboursComplain.map((c) => `${c.name} (${c.line}): ${(getLang() === "ms" && MS_NEIGHBOUR_NOTE[c.note]) || c.note}`),
      note: "Neighbours on the same shared leg report the same pattern. Check the splitter or port before blaming the customer drop." });
  }

  if (profile.repeats === "yes" && !nff.length && !swaps.length) {
    out.push({ key: "recurring_first_time", level: "low", weight: 3,
      because: ["Customer reports the fault recurring"],
      note: "First documented recurrence. Record a timestamped sample so a second visit has something to compare." });
  }

  if (profile.tries === "many") {
    out.push({ key: "self_fix_exhausted", level: "info", weight: 2,
      because: ["Customer already tried the reset and restart routine"],
      note: "Do not repeat basic steps the customer already did. Say what you will do differently." });
  }

  return out.map((f) => ({ ...f, copy: findingCopy(f) }));
}

/* ---------- ranking ----------
   Scores every diagnosis against the answers and evidence.
   Anything the evidence does not support is returned as excluded. */
const RULES = {
  drop_cable: (a) => (P(a, "line_status") === "down" ? 3 : P(a, "speed_at_router") === "n" ? 2 : 0),
  premise_wiring: (a) => (P(a, "speed_at_router") === "n" && P(a, "wifi_pattern") === "n" ? 2 : 0),
  socket_fault: (a) => (P(a, "wifi_pattern") === "n" ? 2 : 0) + (P(a, "speed_at_router") === "n" ? 1 : 0),
  radio_signal: (a, s) => (s.line.type !== "FTTH" && P(a, "speed_at_router") === "n" ? 3 : 0),
  radio_drop: (a, s) => (s.line.type !== "FTTH" && P(a, "line_status") === "up" && P(a, "speed_at_router") === "n" ? 2 : 0),
  radio_distance: (a, s) => (s.line.type !== "FTTH" && P(a, "speed_at_router") === "n" ? 1 : 0),
  olt_capacity: (a) => (P(a, "speed_at_router") === "n" ? 2 : 0),
  splitter: (a, s) => (P(a, "speed_at_router") === "n" && s.customers.filter((c) => /splitter|evening|slow/i.test(c.note)).length ? 3 : 0),
  router_hardware: (a) => (P(a, "router_light") === "green" && P(a, "line_status") === "up" && P(a, "speed_at_router") === "y" ? 2 : 0),
  wifi_coverage: (a) => (P(a, "wifi_pattern") === "y" ? 5 : P(a, "speed_at_router") === "y" ? 3 : 0),
  customer_lan: (a) => (P(a, "wifi_pattern") === "n" && P(a, "speed_at_router") === "y" ? 2 : 0),
  interference: (a) => (P(a, "wifi_pattern") === "y" ? 1 : 0),
};

export function rank(scenario, answers) {
  const a = answers || {};
  // A clean line plus a fine router means nothing outside the home can be
  // blamed. Rather than hide the self-fix options, drop the network-side ones.
  const insideOnly = P(a, "speed_at_router") === "y" && P(a, "line_status") === "up";
  const ranked = Object.entries(RULES)
    .map(([key, score]) => ({ key, score: score(a, scenario), ...DIAGNOSES[key], copy: diagCopy(key, DIAGNOSES[key]) }))
    .filter((d) => d.score > 0 && !(insideOnly && d.skill !== "Customer self-fix"))
    .sort((x, y) => y.score - x.score);
  return { top: ranked[0] || null, rest: ranked.slice(1) };
}

/* ---------- agenda ----------
   Six steps that put unmeasured items first and stop repeating prior work. */
export function agenda(scenario, answers) {
  const a = answers || {};
  const steps = [];
  const nff = scenario.prevVisits.filter((v) => v.conclusion === "NFF");

  const ms = getLang() === "ms";
  const ag = (k, fb) => ms ? { title: MS_AGENDA[k].title, detail: MS_AGENDA[k].detail } : fb;

  steps.push(ag("review", {
    title: "Re-read the previous visit before you touch anything",
    detail: nff.length
      ? `The last visit closed as no fault found (${nff.map((v) => v.id).join(", ")}). Say what you will measure that the last visit did not.`
      : "No prior no-fault-found closure on this line.",
  }));
  if (ms) steps[0].detail = nff.length
    ? MS_AGENDA.review.detailNff.replace("{ids}", nff.map((v) => v.id).join(", "))
    : MS_AGENDA.review.detailNone;

  if (P(a, "speed_at_router") !== "y") {
    steps.push(ag("speed", { title: "Test speed at the router during the customer's busy hour", detail: "Wired device at the router. Record the time, plan speed, and result. Peak-hour numbers are the whole point." }));
  }
  if (P(a, "line_status") === "unknown") {
    steps.push(ag("line", { title: "Confirm line status from the access network before the visit", detail: "Line state decides whether you are chasing a line fault or an in-home fault." }));
  }
  if (P(a, "wifi_pattern") !== "n") {
    steps.push(ag("wifi", { title: "Compare Wi-Fi against a cable in the affected room", detail: "If the cable is fine, stop troubleshooting the line and check coverage, channel, and the device." }));
  }
  steps.push(ag("photo", { title: "Photograph the terminations and the drop entry", detail: "Evidence the next visit can compare against. Include the customer's meter or socket ID in the frame." }));
  steps.push(ag("close", { title: "Agree the outcome in the room", detail: "State fixed, pending network work, or self-fix required. Hand over the post-visit summary before leaving." }));
  return steps;
}

/* ---------- brief ---------- */
export function buildBrief(scenario, answers, profile, meta) {
  const f = findings(scenario, answers, profile);
  const r = rank(scenario, answers);
  const high = f.filter((x) => x.level === "high");
  const medium = f.filter((x) => x.level === "medium");
  const unresolved = [];
  if (P(answers, "line_status") === "unknown" || !answers.line_status) unresolved.push("line status not verified");
  if (P(answers, "speed_at_router") === "nt" || !answers.speed_at_router) unresolved.push("no peak-hour speed measurement at the router");
  if (P(answers, "wifi_pattern") === "nt" || !answers.wifi_pattern) unresolved.push("Wi-Fi versus cable not compared");
  if (!r.top) unresolved.push("no supported diagnosis; one or more checks needed");

  const answeredCount = ["speed_at_router", "line_status", "router_light", "wifi_pattern"]
    .filter((k) => answers && answers[k]).length;
  // A brief may only be called workable once the line and the router were
  // actually measured. Listing a gap is not the same as having evidence.
  const confidence = answeredCount === 4 && !unresolved.length && high.length
    ? "Ready"
    : answeredCount >= 2 && r.top ? "Workable, one gap"
    : "Incomplete";
  const metaOut = {
    technician: meta.technician || "",
    visitId: meta.visitId || "",
    window: scenario.windows,
    line: scenario.line,
    scenarioId: scenario.id,
    generated: new Date().toISOString().slice(0, 16).replace("T", " "),
    synthetic: true,
  };

  return { scenario, meta: metaOut, findings: f, diagnosis: r.top, alternatives: r.rest, agenda: agenda(scenario, answers), unresolved, confidence, profile };
}

/* ---------- post-visit handoff ---------- */
export function buildHandoff(brief, visit) {
  const v = visit || {};
  const closed = v.outcome === "fixed";
  const defect = v.defect || "";
  const needed = v.parts || "";
  const explained = v.outcome
    ? t("expl." + v.outcome)
    : t("handoff.outcomeNotRecorded");
  return {
    brief,
    visit: v,
    explanation: explained,
    reuse: t(closed ? "reuse.closed" : "reuse.open"),
    defect,
    needed,
  };
}
