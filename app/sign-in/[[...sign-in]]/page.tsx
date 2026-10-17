import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Owner sign in" };

export default function SignInPage() {
  return (
    <div className="flex justify-center px-4 py-16">
      <SignIn forceRedirectUrl="/dashboard" />
    </div>
  );
}
