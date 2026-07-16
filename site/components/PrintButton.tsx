"use client";

/** "Download PDF" = window.print() — the print stylesheet IS the PDF (SPEC §8). */
export function PrintButton() {
  return (
    <button
      type="button"
      data-no-print
      onClick={() => window.print()}
      className="btn mono min-h-11 cursor-pointer rounded border px-5 py-2.5 text-sm font-medium"
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
    >
      Download PDF ↓
    </button>
  );
}
