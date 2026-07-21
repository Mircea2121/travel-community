import "./globals.css";

import Navbar from "./components/navbar/navbar";
import Footer from "./components/footer/footer";
import { ToastProvider } from "./components/toast/toastProvider";

export const metadata = {
    title: "Comunitatea Călătorilor",
    description:
        "Descoperă destinații, împărtășește experiențe și conectează-te cu alți călători."
};

export default function RootLayout({ children }) {
    return (
        <html lang="ro">
            <body>
                <ToastProvider>
                    <Navbar />

                    <main>
                        {children}
                    </main>

                    <Footer />
                </ToastProvider>
            </body>
        </html>
    );
}