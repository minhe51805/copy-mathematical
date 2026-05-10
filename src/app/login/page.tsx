import type { Metadata } from "next";
import { LoginPageClient } from "./login-page-client";

export const metadata: Metadata = {
  title: "Dang nhap | AI Math Chat",
  description: "Dang nhap bang tai khoan quan tri de vao AI Math Chat.",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
