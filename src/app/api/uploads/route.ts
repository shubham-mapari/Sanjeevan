import { requireNavigationAdmin } from "@/lib/supabase/admin";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "video/mp4",
  // Office documents
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const maxBytes = 25 * 1024 * 1024; // raised to 25 MB for documents

export async function POST(request: Request) {
  const access = await requireNavigationAdmin();
  if (access.response) return access.response;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return Response.json(
      { error: "Choose a file to upload." },
      { status: 400 },
    );
  if (!allowedTypes.has(file.type))
    return Response.json(
      { error: "Supported formats: JPEG, PNG, WebP, PDF, MP4, DOC, DOCX, PPT, PPTX, XLS, XLSX." },
      { status: 415 },
    );
  if (file.size > maxBytes)
    return Response.json(
      { error: "Files must be 25 MB or smaller." },
      { status: 413 },
    );

  const safeName =
    file.name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(-100) || "upload";
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await access.supabase.storage
    .from("page-assets")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  const { data: publicData } = access.supabase.storage
    .from("page-assets")
    .getPublicUrl(data.path);
  return Response.json(
    { path: data.path, url: publicData.publicUrl },
    { status: 201 },
  );
}
