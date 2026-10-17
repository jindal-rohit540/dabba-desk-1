"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { decideRefund, resolveMessage } from "@/lib/data/dashboard";

// Server Actions are public HTTP endpoints. Every one checks the session itself.
async function requireOwner() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  return userId;
}

const Id = z.string().uuid();

export async function resolveMessageAction(formData: FormData) {
  await requireOwner();
  await resolveMessage(Id.parse(formData.get("id")));
  revalidatePath("/dashboard");
}

export async function decideRefundAction(formData: FormData) {
  await requireOwner();
  const id = Id.parse(formData.get("id"));
  const decision = z.enum(["approved", "rejected"]).parse(formData.get("decision"));
  await decideRefund(id, decision);
  revalidatePath("/dashboard");
}
