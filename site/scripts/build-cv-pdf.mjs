/**
 * Generates public/Aditya-Kumar-CV.pdf from profile.ts (single source of truth).
 * ATS-safe: single linear column, real selectable text, standard section headings,
 * photo embedded as a data URI. Run: `bun scripts/build-cv-pdf.mjs`.
 *
 * ponytail: reuses the already-installed Playwright chromium (page.pdf gives
 * selectable text). No new deps, no running dev server.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";
import { profile } from "../content/data/profile.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = (f) => resolve(__dirname, "../public", f);

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const photo = readFileSync(pub("aditya-kumar.jpeg")).toString("base64");
const photoUri = `data:image/jpeg;base64,${photo}`;

const contact = [
  esc(profile.location),
  profile.phone && esc(profile.phone).replace(/ /g, "&nbsp;"),
  esc(profile.email),
  "adityadev.in",
  `github.com/${profile.handle}`,
  `linkedin.com/in/${profile.handle}`,
]
  .filter(Boolean)
  .join("&nbsp;&nbsp;·&nbsp;&nbsp;");

const section = (title, body) =>
  `<section><h2>${esc(title)}</h2>${body}</section>`;

const experience = profile.experience
  .map(
    (e) => `
    <div class="item">
      <div class="item-head">
        <span class="role">${esc(e.role)} - ${esc(e.company)}</span>
        <span class="meta">${esc(e.period)}${e.location ? " · " + esc(e.location) : ""}</span>
      </div>
      <ul>${e.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </div>`,
  )
  .join("");

const projects =
  `<ul class="tight">` +
  profile.projects
    .map(
      (p) =>
        `<li><b>${esc(p.title)}</b> - ${esc(p.note)} <span class="stack">(${esc(p.stack)})</span></li>`,
    )
    .join("") +
  `</ul>`;

const openSource =
  `<ul class="tight">` +
  profile.openSource.map((o) => `<li><b>${esc(o.title)}</b> - ${esc(o.note)}</li>`).join("") +
  `</ul>`;

const skillsSidebar =
  `<div class="skills">` +
  Object.entries(profile.skills)
    .map(
      ([g, items]) =>
        `<div><span class="skillgroup">${esc(g)}</span>${items.map(esc).join(" · ")}</div>`,
    )
    .join("") +
  `</div>`;

const education =
  `<ul class="tight">` +
  profile.education
    .map(
      (e) =>
        `<li><b>${esc(e.degree)}</b> - ${esc(e.school)} <span class="meta">(${esc(e.year)} · ${esc(e.score)})</span></li>`,
    )
    .join("") +
  `</ul>`;

const languages = profile.languages.map((l) => `${esc(l.name)} - ${esc(l.level)}`).join("&nbsp;&nbsp;·&nbsp;&nbsp;");

const certs = profile.certifications.length
  ? section(
      "Certifications",
      `<ul class="tight">${profile.certifications
        .map((c) => `<li><b>${esc(c.name)}</b> - ${esc(c.issuer)}, ${esc(c.year)}</li>`)
        .join("")}</ul>`,
    )
  : "";

const summary = `${esc(profile.role)} at ${esc(profile.company)} with ${esc(
  profile.yearsExperience,
)} years of experience designing and shipping web products end to end - Laravel and PHP backends, Vue and React frontends, and production AI/LLM integrations. Lead architecture and delivery across a team of 10+ engineers, and have delivered 60+ client projects including payments, real-estate platforms, and AI-powered automation. Based in ${esc(
  profile.location.split(",")[0],
)}; working with clients worldwide.`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --accent: #0891b2; --text: #1a1a1a; --muted: #555; --border: #d8d8d8; --sidebg: #f4f7f8; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Arial, Helvetica, sans-serif; color: var(--text); font-size: 9.7pt; line-height: 1.4; }
  .header { display: flex; align-items: center; gap: 16px; padding-bottom: 10px; border-bottom: 3px solid var(--accent); margin-bottom: 10px; }
  .photo { width: 76px; height: 76px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); flex-shrink: 0; }
  .name { font-size: 21pt; font-weight: 700; letter-spacing: -0.3px; }
  .headline { color: var(--accent); font-weight: 600; font-size: 10.5pt; margin-top: 2px; }
  .contact { color: var(--muted); font-size: 8.3pt; margin-top: 5px; }

  /* Two-column body: sidebar (left) + main (right).
     minmax(0,1fr) + min-width:0 lets the main column wrap instead of overflowing.
     Columns are balanced (Open Source lives in the sidebar) so the CV fits one page. */
  .body { display: grid; grid-template-columns: 31% minmax(0, 1fr); gap: 18px; align-items: start; }
  .side, .main { min-width: 0; }
  .side { padding-right: 4px; border-right: 1px solid var(--border); }
  section { margin-top: 9px; }
  section:first-child { margin-top: 0; }
  h2 { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent);
       border-bottom: 1px solid var(--border); padding-bottom: 2px; margin-bottom: 5px; }
  p.summary { text-align: justify; }
  .item { margin-bottom: 7px; }
  .item:last-child { margin-bottom: 0; }
  .item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .role { font-weight: 700; font-size: 10.5pt; }
  .meta { color: var(--muted); font-size: 8.3pt; white-space: nowrap; }
  ul { margin: 3px 0 0 15px; }
  ul.tight { margin-top: 2px; }
  li { margin-bottom: 2.5px; }
  .stack { color: var(--muted); font-size: 8.5pt; }
  /* Sidebar skills stack vertically (narrow column) */
  .side .skills { display: flex; flex-direction: column; gap: 4px; }
  .side .skillgroup { display: block; font-weight: 700; color: var(--muted); font-size: 8.7pt; }
  section, .item, li { break-inside: avoid; }
</style></head><body>
  <div class="header">
    <img class="photo" src="${photoUri}" alt="${esc(profile.name)}" />
    <div>
      <div class="name">${esc(profile.name)}</div>
      <div class="headline">${esc(profile.headline)}</div>
      <div class="contact">${contact}</div>
    </div>
  </div>
  <div class="body">
    <div class="side">
      ${section("Technical Skills", skillsSidebar)}
      ${section("Education", education)}
      ${section("Open Source", openSource)}
      ${section("Languages", `<p>${languages}</p>`)}
      ${certs}
    </div>
    <div class="main">
      ${section("Summary", `<p class="summary">${summary}</p>`)}
      ${section("Experience", experience)}
      ${section("Selected Projects", projects)}
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.pdf({
  path: pub("Aditya-Kumar-CV.pdf"),
  format: "A4",
  printBackground: true,
  margin: { top: "9mm", bottom: "9mm", left: "12mm", right: "12mm" },
});
await browser.close();
console.log("Wrote public/Aditya-Kumar-CV.pdf");
