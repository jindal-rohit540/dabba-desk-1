import "server-only";
import { db } from "@/lib/supabase/server";
import type { Message } from "@/lib/types";

export type NewMessage = Omit<Message, "id" | "created_at" | "replied_at" | "status"> & {
  status?: Message["status"];
  created_at?: string;
  replied_at?: string | null;
};

export async function insertMessage(message: NewMessage): Promise<void> {
  const { error } = await db().from("messages").insert(message);
  if (error) console.error("insertMessage failed:", error.message);
}
