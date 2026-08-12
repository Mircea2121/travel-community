import "./globals.css";

import Navbar from "./components/navbar/navbar";
import Footer from "./components/footer/footer";
import RealtimeProvider from "./components/messages/realtimeProvider";
import PresenceHeartbeat from "./components/presence/presenceHeartbeat";
import { ToastProvider } from "./components/toast/toastProvider";

export const metadata = {
  title: "Comunitatea Calatorilor",
  description: "Descopera destinatii, impartaseste experiente si conecteaza-te cu alti calatori.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro" data-scroll-behavior="smooth">
      <body>
        <ToastProvider>
          <RealtimeProvider>
            <PresenceHeartbeat />
            <Navbar />
            <main>{children}</main>
            <Footer />
          </RealtimeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
