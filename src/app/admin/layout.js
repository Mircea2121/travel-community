import { redirect } from "next/navigation";

import { requireAdmin } from "@/app/utils/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const { error } = await requireAdmin();

  if (error) {
    redirect("/");
  }

  return children;
}
