"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { type ActionResult, toActionError } from "@/lib/action-result";
import { apiRequest } from "@/lib/api/client";
import {
  postFormSchema,
  type PostFormValues,
  postIdSchema,
  versionSchema,
} from "./schemas";
import type { Post } from "./types";

// Server Actions are public HTTP endpoints: anyone can call them with any
// arguments. Every input is validated here, even though the form validates
// too, and ids are checked before they become part of an API path.

export async function createPost(
  input: PostFormValues,
): Promise<ActionResult<Post>> {
  const parsed = postFormSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }
  try {
    const post = await apiRequest<Post>("/posts", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath("/");
    return { ok: true, data: post };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function updatePost(
  id: string,
  version: number,
  input: PostFormValues,
): Promise<ActionResult<Post>> {
  const parsed = postFormSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }
  if (
    !postIdSchema.safeParse(id).success ||
    !versionSchema.safeParse(version).success
  ) {
    return invalidReference();
  }
  try {
    const post = await apiRequest<Post>(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...parsed.data, version }),
    });
    revalidatePath("/");
    revalidatePath(`/posts/${id}`);
    return { ok: true, data: post };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function deletePost(id: string): Promise<ActionResult> {
  if (!postIdSchema.safeParse(id).success) {
    return invalidReference();
  }
  try {
    await apiRequest<void>(`/posts/${id}`, { method: "DELETE" });
    revalidatePath("/");
    revalidatePath(`/posts/${id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

function invalidInput(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    fieldErrors[field] ??= issue.message;
  }
  return {
    ok: false,
    error: { status: 400, message: "Some fields are invalid.", fieldErrors },
  };
}

function invalidReference(): ActionResult<never> {
  return {
    ok: false,
    error: { status: 400, message: "This post reference is not valid." },
  };
}
