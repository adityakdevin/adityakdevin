import { profile } from "@/content/data/profile";

export function Footer() {
  return (
    <footer
      data-no-print
      className="mt-24 border-t"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="mono text-sm" style={{ color: "var(--muted)" }}>
            <span style={{ color: "var(--accent)" }}>$</span> whoami →{" "}
            <span style={{ color: "var(--text)" }}>{profile.name}</span> · {profile.location}
          </p>
          <nav className="mono flex flex-wrap gap-5 text-sm" aria-label="Footer">
            <a href={profile.github}>GitHub</a>
            <a href={profile.linkedin}>LinkedIn</a>
            <a href={profile.twitter}>X</a>
            <a href={profile.devto}>Dev.to</a>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </nav>
        </div>
        <p className="mt-6 text-sm" style={{ color: "var(--muted)" }}>
          © {new Date().getFullYear()} {profile.name} ({profile.handle}) — Full Stack Developer &
          AI Engineer, {profile.location}. <a href="/privacy">Privacy</a>
        </p>
      </div>
    </footer>
  );
}
