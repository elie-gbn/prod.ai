"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FcGoogle } from "react-icons/fc";
import { emailAuth, signInGoogle, type AuthFormState } from "@/lib/auth-actions";

function openCenteredPopup(name: string) {
  const width = 500;
  const height = 650;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  return window.open(
    "about:blank",
    name,
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    emailAuth,
    {} as AuthFormState,
  );

  async function openGoogleSignIn() {
    const popup = openCenteredPopup("google-signin");
    const result = await signInGoogle();
    const url = typeof result === "string" ? result : result?.url;

    if (!url) {
      popup?.close();
      return;
    }

    if (!popup) {
      window.location.assign(url);
      return;
    }

    window.open(url, "google-signin");

    const timer = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(timer);
        router.refresh();
        return;
      }

      try {
        const href = popup.location.href;
        if (
          popup.location.origin === window.location.origin &&
          !href.includes("/api/auth")
        ) {
          popup.close();
          window.clearInterval(timer);
          router.push("/");
          router.refresh();
        }
      } catch {
        // Still on accounts.google.com; origin is cross-site.
      }
    }, 400);
  }

  return (
    <form
      action={formAction}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Step into the studio</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Sign in to keep your music sessions together.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={8}
            required
          />
        </Field>
        {state?.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        <Field>
          <Button type="submit" name="intent" value="login" disabled={pending}>
            {pending ? "Please wait..." : "Sign in"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button
            onClick={openGoogleSignIn}
            variant="outline"
            type="button"
            disabled={pending}
          >
            <FcGoogle />
            Continue with Google
          </Button>

          <FieldDescription className="text-center">
            New to prod.ai?{" "}
            <Button
              type="submit"
              name="intent"
              value="signup"
              variant="link"
              className="h-auto p-0"
              disabled={pending}
            >
              Create an account
            </Button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
