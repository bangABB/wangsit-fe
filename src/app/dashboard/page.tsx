'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthContext';
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { getAuthToken, setAuthToken } from '@/services/auth';
import axios from 'axios';
import { getCookie, setCookie } from 'cookies-next';

// Debug function to check auth status
const debugAuth = () => {
  console.log('🔍 DEBUG AUTH STATUS:');
  const token = getAuthToken();
  console.log('- Auth token exists:', !!token);
  if (token) {
    console.log('- Token preview:', token.substring(0, 15) + '...');
  }
  
  // Check all cookies
  console.log('🍪 COOKIES:');
  document.cookie.split(';').forEach(cookie => {
    console.log('- Cookie:', cookie.trim());
  });
  
  // Check localStorage
  console.log('📦 LOCAL STORAGE:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      console.log('- Item:', key, localStorage.getItem(key));
    }
  }
  
  return token;
};

export default function Dashboard() {
  // Debug on component load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🚀 Dashboard component mounted');
      debugAuth();
    }
  }, []);

  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

// Update the interface to match the API response
interface ProfileData {
  user_id?: number;
  email?: string;
  name: string;
  asal_sekolah: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

// Function for updating profile data
async function updateProfile(token: string, profileData: ProfileData): Promise<ApiResponse> {
  console.log('Calling updateProfile API with data:', profileData);
  console.log('Using token:', token ? `${token.substring(0, 10)}...` : 'No token found');
  
  // Using relative URL to benefit from Next.js API rewrite in next.config.mjs
  const apiUrl = '/api/auth/me/profile';
  console.log('API endpoint URL:', apiUrl);
  
  try {
    console.log('Sending API request...');
    
    const response = await axios({
      method: 'PUT',
      url: apiUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { asal_sekolah: profileData.asal_sekolah, name: profileData.name }  // Only send asal_sekolah
    });
    
    console.log('API response status:', response.status);
    console.log('API response data:', response.data);
    
    return {
      success: true,
      ...response.data
    };
  } catch (error: any) {
    console.error('API call error:', error);
    
    // Detailed error logging
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      console.error('Error response headers:', error.response.headers);
      
      return {
        success: false,
        message: `Server error: ${error.response.status}`,
        details: error.response.data
      };
    } else if (error.request) {
      console.error('No response received:', error.request);
      return {
        success: false,
        message: 'No response from server. The server might be unavailable.'
      };
    } else {
      return {
        success: false,
        message: `Request error: ${error.message}`
      };
    }
  }
}

// Function to fetch profile data
async function fetchProfileData(token?: string): Promise<ProfileData> {
  try {
    const response = await axios({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Profile data fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching profile data:', error);
    throw error;
  }
}

function DashboardContent() {
  const { user, logout, refreshUser } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    asal_sekolah: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [manualToken, setManualToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize profile data when user data changes
  useEffect(() => {
    if (user) {
      console.log('Setting initial profile data from user:', user);
      setProfileData({
        name: user.name || '',
        asal_sekolah: (user as any).asal_sekolah || '',
      });
    } else {
      console.log('⚠️ User data is not available');
    }
    
    // Check if token exists
    const token = getAuthToken();
    setShowTokenInput(!token);
  }, [user]);

  // In the component's useEffect
  useEffect(() => {
    const token = getAuthToken();
    const getProfileData = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const profileData = await fetchProfileData(token || undefined);
          setProfileData({
            name: profileData.name || '',
            asal_sekolah: profileData.asal_sekolah || ''
          });
        } catch (error) {
          console.error('Failed to load profile data', error);
          setError('Failed to load profile data. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    getProfileData();
  }, [user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Updating ${name} field to: ${value}`);
    
    if (name === 'manual_token') {
      setManualToken(value);
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSetManualToken = () => {
    if (manualToken) {
      console.log('Setting manual token:', manualToken.substring(0, 10) + '...');
      setAuthToken(manualToken);
      setShowTokenInput(false);
      refreshUser();
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('🔵 Form submitted!');
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });
    
    console.log('Form submitted with data:', profileData);
    console.log('Current user before update:', user);
    
    // Get token from auth service directly
    let token = getAuthToken();
    
    // Debug token storage
    console.log('💾 Storage check before API call:');
    debugAuth();
    
    // If no token is found, check if a manual token was provided
    if (!token && manualToken) {
      token = manualToken;
      console.log('Using manually provided token');
    }
    
    console.log('Token retrieved from auth service:', token ? 'Token exists' : 'No token found');
    
    if (!token) {
      console.error('No authentication token available');
      setMessage({ text: 'Authentication error. Please log in again or provide a token manually.', type: 'error' });
      setShowTokenInput(true);
      setIsSubmitting(false);
      return;
    }
    
    console.log('Token being used for API call:', token.substring(0, 10) + '...');
    
    try {
      console.log('🔵 Calling updateProfile function');
      const result = await updateProfile(token, profileData);
      console.log('🔵 Update profile result:', result);
      
      if (result.success) {
        // Update user data through refresh user function
        console.log('Profile update successful, refreshing user data');
        await refreshUser();
        
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setIsEditing(false);
      } else {
        console.error('API returned error:', result);
        setMessage({ 
          text: result.message || 'Failed to update profile. Please try again.', 
          type: 'error' 
        });
      }
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      setMessage({ 
        text: `An error occurred: ${error.message || 'Unknown error'}. Please try again.`, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log('Current user data:', user);
  console.log('Current profile editing state:', isEditing);
  console.log('Current form data:', profileData);

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter',sans-serif]">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700">Wangsit</h1>
          
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 text-gray-800 hover:text-gray-900 focus:outline-none"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-medium overflow-hidden">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
              <span className="font-medium">{user?.name || user?.email}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <a href="/dashboard" className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100">
                  Profile
                </a>
                <a href="/settings" className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100">
                  Settings
                </a>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile header */}
          <div className="relative">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
            <div className="absolute -bottom-16 left-6">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-blue-600 flex items-center justify-center text-white text-4xl font-medium">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
            </div>
          </div>
          
          <div className="mt-16 px-6 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'User'}</h2>
                <p className="text-gray-800">{user?.email}</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  console.log('Toggle edit mode button clicked');
                  setIsEditing(!isEditing);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            
            {/* Display message if there is one */}
            {message.text && (
              <div className={`mt-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message.text}
              </div>
            )}
            
            {/* Manual token input for when token is missing */}
            {showTokenInput && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Authentication Token Missing</h3>
                <p className="text-yellow-700 mb-4">Your authentication token is missing. You can manually provide it below:</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="manual_token"
                    value={manualToken}
                    onChange={handleChange}
                    placeholder="Paste your JWT token here"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleSetManualToken}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Set Token
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => debugAuth()}
                  className="mt-2 text-sm text-yellow-600 hover:text-yellow-800"
                >
                  Check storage status
                </button>
              </div>
            )}
            
            {/* Navigation tabs */}
            <div className="mt-8 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile' 
                      ? 'border-blue-600 text-blue-700' 
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Profile
                </button>
                <button 
                  onClick={() => setActiveTab('activity')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'activity' 
                      ? 'border-blue-600 text-blue-700' 
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Activity
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'settings' 
                      ? 'border-blue-600 text-blue-700' 
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>
            
            {/* Profile content */}
            {activeTab === 'profile' && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4 text-gray-900">About</h3>
                    <p className="text-gray-800">
                      Welcome to your Wangsit profile! This is where you can manage your account and personalize your experience.
                    </p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4 text-gray-900">Recent Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">Logged in successfully</p>
                          <p className="text-sm text-gray-700">Just now</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {isEditing ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-4 text-gray-900">Edit Profile</h3>
                      <form onSubmit={(e) => {
                        console.log('🔴 Form submit event triggered');
                        handleSubmit(e);
                      }}>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              value={profileData.name}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="asal_sekolah" className="block text-sm font-medium text-gray-700 mb-1">
                              Asal Sekolah
                            </label>
                            <input
                              type="text"
                              id="asal_sekolah"
                              name="asal_sekolah"
                              value={profileData.asal_sekolah}
                              onChange={handleChange}
                              placeholder="Nama Sekolah"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                            />
                          </div>
                          
                          <div className="flex items-center justify-end space-x-3 pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                console.log('Cancel button clicked');
                                setIsEditing(false);
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              onClick={() => console.log('🔴 Submit button clicked')}
                              className={`px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium mb-4 text-gray-900">Account Details</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-700">Name</p>
                          <p className="font-medium text-gray-900">{profileData?.name || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">Email</p>
                          <p className="font-medium text-gray-900">{profileData?.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">Asal Sekolah</p>
                          <p className="font-medium text-gray-900">{(profileData as any)?.asal_sekolah || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">User ID</p>
                          <p className="font-medium text-gray-900">{user?.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">Member since</p>
                          <p className="font-medium text-gray-900">
                            {new Date().toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4 text-gray-900">Linked Accounts</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                          G
                        </div>
                        <span className="ml-3 font-medium text-gray-900">Google</span>
                      </div>
                      <span className="text-sm text-green-700 font-medium">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-800">Your recent activity will appear here.</p>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-800">Account settings will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}