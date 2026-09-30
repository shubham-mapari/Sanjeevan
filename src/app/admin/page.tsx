import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// /admin is not a public route. Visiting it directly returns 404.
// The admin panel is accessible only through the private entry path.
export default function AdminRootPage() {
  notFound();
}
