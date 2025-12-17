
import type { Metadata } from 'next';
import Image from 'next/image';
import React from 'react';
import { signIn } from "~/server/auth";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Sign in - Airtable Clone",
  description: "Login page for Airtable Clone",
  icons: [{ rel: "icon", url: "/logo_no_txt.svg" }],
}


// Local component for login form button
interface LoginFormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const LoginFormButton: React.FC<LoginFormButtonProps> = ({ children, ...props }) => (
  <button
    className="w-full bg-white border border-gray-300 hover:bg-gray-50 py-2 rounded-md transition-colors flex items-center justify-center hover:cursor-pointer gap-3"
    {...props}
  >
    {children}
  </button>
);

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex items-center justify-between max-w-[1536px] w-full">
          {/*Login form */}
          <div className="flex-1 flex justify-center items-center">
            <div className="flex-1 max-w-[500px]">
              <div className="mb-12">
                <Image
                  src="/logo_no_txt.svg"
                  alt="Airtable Logo"
                  width={180}
                  height={180}
                  className="h-10 w-10 mb-13"
                />
                <h1 className="text-3xl font-regular text-gray-900">Sign in to Airtable</h1>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-normal text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="Email address"
                    className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none placeholder-gray-400 placeholder:font-normal focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  className="w-full bg-[rgba(27,97,201,0.4)] hover:bg-blue-500 text-white font-regular py-2 rounded-md transition-colors"
                >
                  Continue
                </button>
              </div>
              <div className="mt-6 mb-6 text-center text-gray-500 text-sm">or</div>
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/" });
                }}
                className="w-full flex flex-col gap-4 mb-20"
              >
                <LoginFormButton>
                  <p className="text-gray-700 font-regular">
                    <span>Sign in with </span>
                    <span className="font-bold">Single Sign On</span>
                  </p>
                </LoginFormButton>
                <LoginFormButton type="submit">
                  <FcGoogle className="w-5 h-5" />
                  <p className="text-gray-700 font-regular">
                    <span>Continue with </span>
                    <span className="font-bold">Google</span>
                  </p>
                </LoginFormButton>
                <LoginFormButton>
                  <FaApple className="w-5 h-5" />
                  <p className="text-gray-700 font-regular">
                    <span>Continue with </span>
                    <span className="font-bold">Apple ID</span>
                  </p>
                </LoginFormButton>
              </form>
              <p className="mt-8 text-xs text-gray-600">
                New to Airtable?{' '}
                <a href="#" className="text-blue-600 underline">
                  Create an account
                </a>{' '}
                instead
              </p>
            </div>
          </div>
          {/* Marketing panel */}
          <div className="flex-1 justify-center items-center hidden xl:flex">
            <Image
              src="/omni_signin_large@2x.png"
              alt="Airtable Marketing"
              width={600}
              height={400}
              className="hidden md:block w-[395px] h-[580px] rounded-lg shadow-lg"
            />
          </div>
        </div>
    </div>
  );
};

export default LoginPage;