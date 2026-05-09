import type { Metadata } from "next";
import { LoginPageClient } from "./login-page-client";

export const metadata: Metadata = {
  title: "Đăng nhập | AI Math Chat",
  description: "Đăng nhập bằng tài khoản mock để vào AI Math Chat.",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
