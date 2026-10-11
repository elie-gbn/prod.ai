"use server";

import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn, signOut } from "./authentication";
import { createUser, normalizeEmail } from "./users";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function signInGoogle() {
  return signIn("google", { redirect: false, redirectTo: "/" });
}

export type AuthFormState = { error?: string };

export async function emailAuth(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const normalizedEmail = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const intent = String(formData.get("intent") ?? "login");

  if (!normalizedEmail || !password) {
    return { error: "Invalid email or password" };
  }

  try {
    if (intent === "signup") {
      await createUser(normalizedEmail, password);
    }

    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Something went wrong" };
  }

  return {};
}
