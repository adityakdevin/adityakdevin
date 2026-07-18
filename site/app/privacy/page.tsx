import type { Metadata } from "next";
import { profile } from "@/content/data/profile";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Plain-language privacy policy for adityadev.in: what analytics collect, how contact form data is handled, and how to request removal.",
  alternates: { canonical: "/privacy" },
};

/** Privacy (SPEC S5, outside voice T5): plain language, no legalese theater. */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
      <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>$</span> cat privacy.md
      </p>
      <h1 className="mono h2-rule text-4xl font-semibold">Privacy, in plain language</h1>
      <p className="mt-4" style={{ color: "var(--muted)" }}>
        Last updated: July 2026. This is a personal portfolio site. Here is everything it does
        with data - written by a human, for humans.
      </p>

      <section className="mt-10 space-y-8">
        <div>
          <h2 className="mono text-xl font-semibold">Analytics</h2>
          <p className="mt-2">
            The site uses Google Analytics 4 to count visits and see which pages people read. It
            collects approximate location (city level), device type, and pages visited. I use this
            to understand what content is useful - nothing else. Vercel Speed Insights also runs;
            it measures page speed and is cookieless.
          </p>
        </div>

        <div>
          <h2 className="mono text-xl font-semibold">Contact form</h2>
          <p className="mt-2">
            When you send a message, your name, email, and message are emailed to me via Mailtrap
            and land in my inbox ({profile.email}). The form also notes which page you were on
            and how you first arrived (the referring site), so I know what content brought you
            here. None of it is stored in any database, shared with anyone, or added to any
            mailing list. Server errors are logged for 30 days without message contents.
          </p>
        </div>

        <div>
          <h2 className="mono text-xl font-semibold">Newsletter</h2>
          <p className="mt-2">
            If you subscribe to the field notes, your email address is sent to Buttondown, the
            service that delivers the emails and has its own privacy policy. You&apos;ll get a
            confirmation email first (double opt-in), every email has an unsubscribe link, and
            unsubscribing removes you completely. Your address is used for nothing else.
          </p>
        </div>

        <div>
          <h2 className="mono text-xl font-semibold">Booking</h2>
          <p className="mt-2">
            &ldquo;Book a call&rdquo; goes to cal.com, which handles the scheduling and has its
            own privacy policy. I receive the details you enter there (name, email, notes).
          </p>
        </div>

        <div>
          <h2 className="mono text-xl font-semibold">The AI assistant (when it ships)</h2>
          <p className="mt-2">
            A chat widget is planned. When live: messages you type will be sent to Anthropic&apos;s
            Claude API to generate answers, and may be logged by me to debug quality. Don&apos;t
            paste anything sensitive into it - it&apos;s for asking about my work.
          </p>
        </div>

        <div>
          <h2 className="mono text-xl font-semibold">Cookies &amp; storage</h2>
          <p className="mt-2">
            Your theme choice (dark/light) is kept in your browser&apos;s localStorage. GA4 sets
            its standard cookies. That&apos;s the whole list.
          </p>
        </div>

        <div>
          <h2 className="mono text-xl font-semibold">Removal</h2>
          <p className="mt-2">
            Want anything you sent me deleted? Email{" "}
            <a href={`mailto:${profile.email}`}>{profile.email}</a> and it&apos;s gone within a
            week, no questions.
          </p>
        </div>
      </section>
    </main>
  );
}
