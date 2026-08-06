import SettingsClient from "../components/settings/settingsClient";
import "./settings.css";

export const metadata = {
  title: "Setări cont | Comunitatea Călătorilor",
  description:
    "Gestionează securitatea și opțiunile contului tău.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
