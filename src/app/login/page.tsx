import type { Metadata } from 'next';
import Image from 'next/image';
import React from 'react';
import { FaGoogle } from "react-icons/fa";
import { signIn } from "~/server/auth";

export const metadata: Metadata = {
  title: "Sign in - Airtable Clone",
  description: "Login page for Airtable Clone",
  icons: [{ rel: "icon", url: "/logo.svg" }],
}

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-6xl flex items-center justify-between gap-8">
        {/*Login form */}
        <div className="flex-1 max-w-md">
          <div className="mb-8 space-y-8">
            <Image
                src="/logo.svg"
                alt="Airtable Logo"
                width={180}
                height={180}
                className="h-10 w-10"
            />
            <h1 className="text-3xl font-light text-gray-900">Sign in to Airtable</h1>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              className="w-full bg-blue-200 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors"
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
            className="w-full"
          >
            <button
              type="submit"
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center hover:cursor-pointer gap-3"
            >
              <FaGoogle className="w-5 h-5" />
              Continue with Google
            </button>
          </form>

          <p className="mt-8 text-sm text-gray-600">
            New to Airtable?{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Create an account
            </a>{' '}
            instead
          </p>
        </div>

        {/* Marketing panel */}
        <Image
            src="/omni_signin_large@2x.png"
            alt="Airtable Marketing"
            width={600}
            height={400}
            className="hidden md:block w-1/2 rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
};

export default LoginPage;