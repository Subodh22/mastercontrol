"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const PassionSchema = z.enum(["real_estate", "sales", "content"]);

const CreateSchema = z.object({
  passion: PassionSchema,
  title: z.string().min(1).max(140),
  content: z.string().max(200_000).optional(),
});

export async function createPassionNote(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = CreateSchema.safeParse({
    passion: String(formData.get("passion") ?? ""),
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
  });
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(", "));

  const { data, error } = await supabase
    .from("passion_notes")
    .insert({
      user_id: user.id,
      passion: parsed.data.passion,
      title: parsed.data.title,
      content: parsed.data.content ?? "",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/passions/${parsed.data.passion}`);
  redirect(`/passions/${parsed.data.passion}/${data.id}`);
}

export async function deletePassionNote(id: string, passion: string) {
  const supabase = await createClient();
  const parsed = PassionSchema.safeParse(passion);
  if (!parsed.success) throw new Error("Invalid passion");

  const { error } = await supabase.from("passion_notes").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/passions/${parsed.data}`);
  redirect(`/passions/${parsed.data}`);
}
