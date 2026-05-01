import { AuthForm } from "@/components/AuthForm";

export default function AuthPage({
  searchParams
}: {
  searchParams?: { mode?: string };
}) {
  return (
    <AuthForm initialMode={searchParams?.mode === "signup" ? "signup" : "login"} />
  );
}
