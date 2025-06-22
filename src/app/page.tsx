'use client';

import { useAuth } from '@/components/AuthContext';
import { getGoogleAuthUrl } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = () => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    window.location.href = getGoogleAuthUrl(redirectUri);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Wangsit</h1>
          <p className="text-gray-600">Sign in to access your account</p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : user ? (
          <div className="text-center">
            <p className="mb-4">Already logged in as {user.email}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-lg shadow-md px-6 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100 focus:outline-none transition duration-150 mb-4"
            >
              <svg className="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M12 5c1.617 0 3.101.554 4.286 1.593l3.204-3.204C17.542 1.673 14.836.5 12 .5 7.333.5 3.354 2.902 1.196 6.45l3.494 2.73C5.797 6.77 8.644 5 12 5z" />
                <path fill="#34A853" d="M12 18.5c-3.356 0-6.203-1.77-7.31-4.22L1.196 17.55C3.354 21.098 7.332 23.5 12 23.5c2.821 0 5.496-.926 7.5-2.508v-0.002l-3.09-2.392c-1.206.926-2.741 1.402-4.41 1.402z" />
                <path fill="#FBBC05" d="M5 12c0-.768.125-1.5.362-2.17L1.868 7.1C1.03 8.569.5 10.214.5 12c0 1.786.53 3.431 1.368 4.9l3.494-2.73C5.151 13.57 5 12.768 5 12z" />
                <path fill="#EA4335" d="M12 5c2.69 0 4.915 1.184 6.616 3.55.214.307.177.727-.119 1.022l-4.092 4.092a.75.75 0 01-1.06 0l-4.566-4.566a.75.75 0 010-1.06l3.091-3.092A.747.747 0 0112 5z" />
              </svg>
              Sign in with Google
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 