import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "./utils/seo";
import "./globals.css";

import SessionProvider from "./components/auth/sessionProvider";
import Navbar from "./components/navbar/navbar";
import Footer from "./components/footer/footer";
import RealtimeProvider from "./components/messages/realtimeProvider";
import PresenceHeartbeat from "./components/presence/presenceHeartbeat";
import { ToastProvider } from "./components/toast/toastProvider";

export const metadata = {
 metadataBase: new URL(SITE_URL),
 title: { default: SITE_NAME, template: "%s | " + SITE_NAME },
 description: SITE_DESCRIPTION,
 openGraph: { type: "website", locale: "ro_RO", siteName: SITE_NAME, title: SITE_NAME, description: SITE_DESCRIPTION, images: [{url:"/images/hero-santorini.webp"}] },
 twitter: {card:"summary_large_image"},
 icons: {icon:"/favicon.svg",shortcut:"/favicon.svg"},
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro" data-scroll-behavior="smooth">
      <body>
        <ToastProvider>
          <SessionProvider>
          <RealtimeProvider>
            <PresenceHeartbeat />
            <Navbar />
            <main>{children}</main>
            <Footer />
          </RealtimeProvider>
          </SessionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
