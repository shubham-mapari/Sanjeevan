import type { RichDocument } from "@/lib/navigation-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LeaderDesignation = "Chairman" | "Joint Secretary" | "Principal";

export type Leader = {
  id: string;
  name: string;
  designation: LeaderDesignation;
  photo_url: string;
  message_title: string;
  message: RichDocument;
  signature_url: string | null;
  email: string | null;
  display_order: number;
  is_active: boolean;
  published: boolean;
  created_at: string;
};

export async function getPublishedLeaders(): Promise<Leader[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("leaders")
    .select("*")
    .eq("is_active", true)
    .eq("published", true)
    .order("display_order", { ascending: true });

  if (error) return [];
  return (data ?? []) as Leader[];
}