import AdminPanel from "@/app/components/admin/adminPanel";

export const metadata = {
  title: "Administrare | Comunitatea Călătorilor",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminPanel />;
}
