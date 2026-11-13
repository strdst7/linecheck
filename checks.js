/* Checks a technician or CSR can run before or during a visit.
   Deliberately small: four checks that separate "at the line" from
   "inside the home", no vendor tooling required. */
export const CHECKS = [
  {
    id: "speed_at_router",
    label: "Speed on the router LAN is normal",
    detail: "Test a wired device at the router during the customer's normal busy hour.",
    options: [
      { v: "y", label: "Yes, near the plan" },
      { v: "n", label: "No, weak at the router" },
      { v: "nt", label: "Not tested / off-peak only" },
    ],
  },
  {
    id: "line_status",
    label: "Line status from the access network",
    detail: "Check the line state reported by the network before you knock.",
    options: [
      { v: "up", label: "Line is up" },
      { v: "down", label: "Line is down" },
      { v: "unknown", label: "Not verified" },
    ],
  },
  {
    id: "router_light",
    label: "Router indicator when the fault happens",
    detail: "Ask the customer. 'Blinking' means different things on different models, so use the device label.",
    options: [
      { v: "green", label: "Steady green, still no service" },
      { v: "red", label: "Red or blinking red" },
      { v: "off", label: "Off / no power" },
      { v: "unknown", label: "Customer cannot tell" },
    ],
  },
  {
    id: "wifi_pattern",
    label: "Slowness follows Wi-Fi only",
    detail: "Compare the same test over Wi-Fi and over a cable in the same room.",
    options: [
      { v: "y", label: "Yes, cable is fine" },
      { v: "n", label: "No, slow on cable too" },
      { v: "nt", label: "Not compared" },
    ],
  },
];

/* What each answer means. Used by the brief to explain, not to assert facts. */
export const WHY = {
  speed_at_router: {
    y: "Speed at the router meets the plan. The line is delivering; the fault is downstream.",
    n: "The router is already slow. The line, drop, or shared leg is short of the plan.",
    nt: "Speed is unconfirmed. A visit must not close the job without a peak-hour test at the router.",
  },
  line_status: {
    up: "Line is up. A total line failure is ruled out; intermittent faults remain possible.",
    down: "Line is down. The fault is at or before the customer line.",
    unknown: "Line status unverified. Any wiring conclusion rests on the customer's description only.",
  },
  router_light: {
    green: "Indicator steady with no service points away from the line.",
    red: "Red with no service is consistent with a line or provisioning fault.",
    off: "No power beats every other explanation. Confirm power first.",
    unknown: "No device-level confirmation.",
  },
  wifi_pattern: {
    y: "Cable fine, Wi-Fi poor: coverage, channel, or interference.",
    n: "Cable also poor: not a Wi-Fi problem.",
    nt: "Cannot separate a line fault from a Wi-Fi fault.",
  },
};
