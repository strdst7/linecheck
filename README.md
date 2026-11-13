# Linecheck

Turns a fault report and four checks into a technician brief, a visit agenda, and a post-visit handoff.

An MI4inc lab tool by KDMIRAH Lab. English and Bahasa Melayu, light and dark, no build step.

## Who it is for

Field technicians, and the support agents who book their visits. Built from the pattern every broadband field team knows: the same fault comes back, the last visit closed as "no fault found", and the next technician arrives without knowing what was already tried.

## The problem

The fault report is not the problem. The problem is what reaches the technician: a one-line complaint, a prior visit that found nothing, and no record of which measurement was skipped. So the repeat visit repeats the first one.

Linecheck turns that into a brief that says what to measure first and why, what the last visit missed, what to bring, and what to leave behind.

## How to use it

1. **Report.** Pick one of four fictional reports. Mark what the customer already tried and whether the fault returned. Optionally paste the customer's own words. That text is labelled unverified and never becomes evidence.
2. **Checks.** Answer any of four checks, or none. Each check explains what its answer means. Unanswered checks become explicit gaps, not guesses.
3. **Brief.** The output: findings with the evidence behind each one, a lead diagnosis with an on-site time estimate, a visit agenda, safety and access notes, parts, neighbouring lines, and prior visits. Print it or copy it as text.
4. **Handoff.** Record the outcome, the defect, the parts, and the next step. Anything left blank shows as "not recorded", never as done.

## How it decides

Twelve possible faults are scored against the four checks. A fault only appears when a check supports it. A clean line with a healthy router cannot produce a drop-cable diagnosis, because no answer would justify one.

The ranking orders the work. It does not prove a cause. Every finding lists the answer or record that produced it, so the technician can disagree with the reasoning line by line.

A brief stays **Incomplete** until line status and speed at the router are both measured. Listing a gap is not the same as having evidence, and the tool does not confuse the two.

## Data and limits

- All customers, addresses, phone numbers, lines, prior visits, neighbour records, and measurements are **synthetic and fictional**. No provider data, customer record, or network telemetry is used.
- No provider name, logo, or branding appears anywhere.
- Time and parts figures are labelled estimates, not quotes.
- The tool does not confirm coverage. Nothing here is a coverage claim.
- No AI model runs at runtime. The decision table is fixed and its outputs are auditable.

## Language and theme

- **EN / BM** in the header. Every interface string, scenario description, check, finding, agenda step, and export translates. The decision logic does not: the same answers produce the same diagnosis in both languages, and the self-check asserts that.
- Malay keeps Malaysian field vocabulary rather than literal translation: *talian* (line), *kabel turun* (drop cable), *lawatan* (visit), *pemisah* (splitter), *belum dipastikan* (not yet established). NFF stays NFF, as it does in the field.
- **Light / dark** follows the system preference on first load. The toggle overrides and persists. Both palettes are checked at WCAG AA or better; the darkest pair used is 4.77:1.

## Running it

Static files, no build step, no dependencies.

```sh
python3 -m http.server 8099
```

Open `http://127.0.0.1:8099`. Works from any static host.

Engine self-check:

```sh
node engine.test.mjs
```

## Files

| File | Role |
| --- | --- |
| `index.html` | Four screens and the method dialog |
| `styles.css` | Light theme, one accent, print rules |
| `app.js` | Wiring, rendering, print and copy export |
| `engine.js` | Findings, ranking, agenda, handoff (pure functions, no DOM) |
| `checks.js` | The four checks and what each answer means |
| `scenarios.js` | Four synthetic reports plus the fault catalogue |
| `i18n.js` | Both language dictionaries and the `t()` lookup |
| `ms.js` | Malay prose for scenarios, checks, findings, agenda |
| `favicon.svg` | The mark, for the browser tab |
| `engine.test.mjs` | Self-check: 32 assertions, run with `node` |
