import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập | ToyStore Admin",
  description: "Đăng nhập vào hệ thống quản trị ToyStore - Đồ Chơi Trẻ Em",
};

export default function AdminLoginPage() {
  return <SignInForm />;
}
