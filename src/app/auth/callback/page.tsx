'use client';

import { useAuth } from '@/components/AuthContext';
import { exchangeGoogleCode, setAuthToken } from '@/services/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(errorParam);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        console.log("Processing OAuth callback with code:", code);
        
        const authResponse = await exchangeGoogleCode(code, redirectUri);
        
        // Store the token
        setAuthToken(authResponse.access_token);
        
        // Refresh the user data in the context
        await refreshUser();
        
        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error: any) {
        console.error('Authentication error:', error);
        
        let errorMessage = 'Failed to authenticate with Google';
        let details = null;
        
        if (error.response) {
          errorMessage = `Server error: ${error.response.status}`;
          try {
            // Try to parse the response data for more details
            details = JSON.stringify(error.response.data, null, 2);
          } catch (e) {
            details = `Error response: ${error.response.data}`;
          }
        } else if (error.request) {
          errorMessage = 'No response from server';
          details = 'The server did not respond to the authentication request. The backend might be unavailable.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
        
        setError(errorMessage);
        setErrorDetails(details);
      }
    };

    handleCallback();
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
        {error ? (
          <div className="text-red-500">
            <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
            <p className="mb-4">{error}</p>
            
            {errorDetails && (
              <div className="mt-4 mb-4">
                <h3 className="text-md font-bold mb-2">Error Details</h3>
                <div className="bg-gray-100 p-4 rounded text-xs text-left overflow-auto">
                  <pre>{errorDetails}</pre>
                </div>
              </div>
            )}
            
            <div className="mt-4 mb-4">
              <h3 className="text-md font-bold mb-2">Troubleshooting Steps</h3>
              <ul className="text-left text-sm">
                <li>Make sure the backend server is running</li>
                <li>Check that CORS is correctly configured on the backend</li>
                <li>Verify your Google OAuth credentials are correct</li>
                <li>Ensure the redirect URI is registered in the Google Console</li>
              </ul>
            </div>
            
            <button
              onClick={() => router.push('/')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold">Authenticating...</h2>
            <p className="text-gray-600 mt-2">Please wait while we sign you in.</p>
          </div>
        )}
      </div>
    </div>
  );
} 