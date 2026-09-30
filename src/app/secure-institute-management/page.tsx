import { redirect } from "next/navigation";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-config";

export const dynamic = "force-dynamic";

export default function SecureAdminRootPage() {
  redirect(ADMIN_LOGIN_PATH);
}
