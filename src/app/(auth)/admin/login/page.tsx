import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | ToyStore Admin",
  description: "Login to ToyStore Admin System",
};

export default function AdminLoginPage() {
  return <SignInForm />;
}
