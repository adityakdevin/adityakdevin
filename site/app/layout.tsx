import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Script from "next/script";
import { profile } from "@/content/data/profile";
import { StickyChrome } from "@/components/StickyChrome";
import { Attribution } from "@/components/Attribution";
import { Footer } from "@/components/Footer";
import { Terminal } from "@/components/Terminal";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${profile.name} - Full Stack Developer, AI Engineer & Solution Architect`,
    template: `%s · ${profile.name} (${profile.handle})`,
  },
  description: `${profile.name} (${profile.handle}) - ${profile.role} @ ${profile.company}. ${profile.yearsExperience} years building Laravel, Vue & React products, now shipping AI/LLM features into production. Based in Lucknow, India. Available for AI integration and full-stack projects.`,
  alternates: { canonical: "./" },
  openGraph: {
    siteName: `${profile.name} - ${profile.handle}`,
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", creator: `@${profile.handle}` },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: profile.handle },
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
  viewportFit: "cover", // safe-area env() insets on notched phones
};

/** Theme boot: runs pre-paint so there is never a flash (SPEC S5A). */
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        // mobile: reserve room for the fixed bottom tab bar (h-16 + safe-area)
        className={`${plexMono.variable} ${plexSans.variable} flex min-h-full flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] antialiased md:pb-0`}
      >
        <Attribution />
        <StickyChrome />
        {children}
        <Footer />
        <Terminal />
        {/* Tag management - deferred: never in the critical path (SPEC S9).
            GTM wins when set (manage GA4 inside GTM); direct gtag is the fallback. */}
        {process.env.NEXT_PUBLIC_GTM_ID ? (
          <Script id="gtm" strategy="lazyOnload">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');`}
          </Script>
        ) : process.env.NEXT_PUBLIC_GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="ga4" strategy="lazyOnload">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
