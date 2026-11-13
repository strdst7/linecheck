/* Linecheck: fault-to-brief engine.
   Rule-based, no AI at runtime. Every output line cites evidence
   (scenario field, prior visit, or check answer), so a technician can
   challenge any conclusion. Scenarios are FICTIONAL LABOUR ONLY. */

export const DIAGNOSES = {
  drop_cable:       { label: "Drop cable / lead-in fault",      skill: "Cable technician",     parts: ["2-pair drop cable (length estimate)", "drop clamps", "sealing putty / entry sleeve"], min: 45,  max: 75 },
  premise_wiring:   { label: "Premise wiring / extension fault",skill: "Field technician",     parts: ["patch lead", "surface cable clips", "keystone jack"],                          min: 60,  max: 120 },
  socket_fault:     { label: "Socket / first termination fault",skill: "Field technician",     parts: ["network socket", "backbox (flush)", "patch lead"],                             min: 30,  max: 60 },
  radio_signal:     { label: "Signal problem at the customer line", skill: "Access technician", parts: ["connector kit (f-type)", "splitter (isolator on request)"],                  min: 30,  max: 60 },
  radio_drop:       { label: "Drop / connector problem outside",   skill: "Access technician", parts: ["outdoor drop cable", "f-type connectors", "pole clamps"],                     min: 45,  max: 90 },
  radio_distance:   { label: "Distance / coverage limit (line runs to edge of leg)", skill: "Network team referral", parts: ["signal meter report", "line profile read"], min: 0, max: 0, noVisit: true },
  olt_capacity:     { label: "Capacity / congestion on shared leg", skill: "Network team referral", parts: ["port utilisation export"], min: 0, max: 0, noVisit: true },
  splitter:         { label: "Splitter or node-side loss",        skill: "Access technician", parts: ["splitter (1x8)", "connector kit (sc/apc)"],                                   min: 30,  max: 60 },
  router_hardware:  { label: "Router hardware or firmware fault", skill: "Return plus swap", parts: ["same-model ONT/router swap", "pre-labelled returns bag"], min: 10, max: 20 },
  wifi_coverage:    { label: "In-home Wi-Fi coverage",            skill: "Customer self-fix", parts: ["optional mesh node (chargeable)"], min: 0, max: 0, noVisit: true },
  customer_lan:     { label: "Customer equipment or in-home cabling", skill: "Customer self-fix", parts: [], min: 0, max: 0, noVisit: true },
  interference:     { label: "Local interference (unconfirmed)",  skill: "Field technician", parts: ["router re-channel (firmware)", "channel scan report"],                         min: 15,  max: 30 },
};

const SCENARIOS = [
  {
    id: "S-4471",
    customer: "Halima B. Nordin",
    phone: "+60 12 004 88 34",
    bins: "7 Jalan Kenari 3",
    windows: "08:00 to 12:00, any weekday",
    address: "14 Jalan Kenari 3, Taman Sri Kenari, 56000 Cheras, Kuala Lumpur",
    accessNotes: "Gated terrace. Gate code issued by customer on request. Behind the house, the drop runs over a shared carport roof and needs the neighbour's permission to reach. Ask before climbing.",
    safety: [
      "Shared carport roof is perished: do not load it. Inspect the drop from ground level and the lower rung only.",
      "Rear boundary has a dog. Customer must secure it before the technician enters.",
    ],
    line: { type: "FTTH", label: "Fibre (50 Mbps package)", olt: "OLT-4", port: "port 12/3" },
    report: {
      reported: "Intermittent drop-outs and slow evenings for 6 weeks, three separate reports (see prev 4471-A/B/C). Shows 'No Service' on the router for minutes at a time.",
      csrChecklist: "Reviewed line status: line shows online. No confirmed customer-side record. Router LED observed red on two reports.",
    },
    prevVisits: [
      { id: "VV-4471-A", daysAgo: 34, found: "Billed: no fault found. Replaced patch lead at customer request.", conclusion: "NFF" },
      { id: "VV-4471-B", daysAgo: 21, found: "Replaced customer router (same model). Drop-outs continued same week.", conclusion: "hardware swap" },
      { id: "VV-4471-C", daysAgo: 9,  found: "Billed: no fault found. Longer visit (95 min).", conclusion: "NFF" },
    ],
    customers: [
      { name: "Mr Tan Hock Seng", line: "line 6 to 8", role: "neighbour, direct cable path", note: "Shares the carport the drop crosses." },
      { name: "Mrs Fatimah Yusof", line: "line 6 to 10", role: "neighbour, works from home", note: "Reports evening video calls failing, same as Halima." },
      { name: "Unit 3B, Kancil Holdings", line: "line 5 to 2", role: "business line, no after-hours use", note: "No complaints on record." },
    ],
  },
  {
    id: "S-2290",
    customer: "K. Rajendran",
    phone: "+60 16 772 41 09",
    bins: "5A Jalan Jelatek",
    windows: "13:00 to 17:00, Saturdays only",
    address: "5A Jalan Jelatek, 54200 Kuala Lumpur",
    accessNotes: "Apartment, level 5. Lift access. Fibre terminates in the unit's utility closet; side by side with the neighbouring unit's box. Label every cable you unplug.",
    safety: [
      "Utility closet is narrow with exposed trunking edges. Gloves and a torch required.",
      "Customer keeps birds in the living room. Avoid opening windows on that side.",
    ],
    line: { type: "FTTH", label: "Fibre (100 Mbps package)", olt: "OLT-7", port: "port 3/1" },
    report: {
      reported: "No internet after a thunderstorm. Wants a same-day visit. Says 'the box is blinking' and the TV also restarted that night.",
      csrChecklist: "Line verified from the remote end: line is down. Router light pattern: red. No surge damage reported by customer yet.",
    },
    prevVisits: [
      { id: "VV-2290-A", daysAgo: 61, found: "Routine installation. Cat6 from utility closet to TV cabinet, socket terminated, good.", conclusion: "install" },
    ],
    customers: [
      { name: "Aisyah R.", line: "unit 5B", role: "neighbour, same closet", note: "Same closet, separate connection. Could have been knocked." },
      { name: "Beng Weng", line: "unit 4C", role: "neighbour, reports OK", note: "No issues reported." },
      { name: "Guard post", line: "building line", role: "building main", note: "Confirms no site-wide incident reported." },
    ],
  },
  {
    id: "S-7734",
    customer: "Farah Najwa Idris",
    phone: "+60 11 220 55 07",
    bins: "9, Lorong 4",
    windows: "09:00 to 18:00, weekdays",
    address: "9 Lorong 4, Taman Megah, 47300 Petaling Jaya",
    accessNotes: "Terrace, clear frontage. Fibre box on the front wall on the right of the door. Gate is open during the window.",
    safety: ["Working at a low height only. No climbing expected."],
    line: { type: "FTTH", label: "Fibre (300 Mbps package)", olt: "OLT-2", port: "port 7/9" },
    report: {
      reported: "Fast speed right at the router, very slow everywhere else. Wi-Fi drops the video-call client in the back room. Wants an engineer to 'fix the wiring'. Line speed is not reported as slow.",
      csrChecklist: "Line verified: line is up. Customer reports the same on every device in the back room. Front room is fine.",
    },
    prevVisits: [],
    customers: [
      { name: "Chris Lim", line: "Lorong 4", role: "neighbour", note: "No issue reported." },
    ],
  },
  {
    id: "S-1180",
    customer: "Muhammad Azlan bin Yusuf",
    phone: "+60 19 334 86 11",
    bins: "22 Jalan Pandan Indah 6",
    windows: "08:00 to 11:00, weekdays",
    address: "22 Jalan Pandan Indah 6, 55100 Kuala Lumpur",
    accessNotes: "Terrace, drop comes off a shared pole at the rear. The pole footpath is muddy after rain. Bring boot covers.",
    safety: [
      "Pole is shared with the electricity feed. Observe the minimum approach distance and confirm the pole has no temporary stay wire before touching anything.",
      "Path at the rear is uneven and mud can hide a kerb drop: walk it before carrying the ladder.",
    ],
    line: { type: "FTTH", label: "Fibre (30 Mbps package)", olt: "OLT-4", port: "port 12/7" },
    report: {
      reported: "Two previous visits reported 'no fault found'. Speed is under half the plan speed at the router, but only in the evening. First visit replaced a cable, second was billed as NFF. Customer has the visits on video and is frustrated.",
      csrChecklist: "Line verified: line is up. Line profile shows speed profile 100/50 provisioned against a 30 Mbps package. Speed samples from customer are 3 to 4 Mbps at the router during peak.",
    },
    prevVisits: [
      { id: "VV-1180-A", daysAgo: 44, found: "Replaced the external drop cable 'as a precaution'. Speed unchanged.", conclusion: "hardware swap" },
      { id: "VV-1180-B", daysAgo: 17, found: "Billed: no fault found. Speed not tested at peak.", conclusion: "NFF" },
    ],
    customers: [
      { name: "Pandan Indah 6 block C", line: "splitter group", role: "shared splitter", note: "Three neighbours on the same splitter group report slow evenings." },
      { name: "Suresh K.", line: "same splitter", role: "neighbour", note: "Slow evenings only, daytime fine." },
    ],
  },
];

export const getScenario = (id) => SCENARIOS.find((s) => s.id === id) || null;
export const SCENARIO_LIST = SCENARIOS.map(({ id, customer, bins, report }) => ({
  id, customer, bins, reported: report.reported,
}));

