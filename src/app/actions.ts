"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const NewConversationSchema = z.object({
  title: z.string().min(1).max(140),
  content: z.string().min(1).max(200_000),
});

export async function createConversation(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = NewConversationSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { error } = await supabase.from("conversations").insert({
    user_id: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/conversations");
  redirect("/conversations");
}

export async function deleteConversation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/conversations");
}
