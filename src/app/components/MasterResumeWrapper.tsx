"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "lib/redux/store";

interface MasterResumeWrapperProps {
  children: React.ReactNode;
}

export const MasterResumeWrapper = ({ children }: MasterResumeWrapperProps) => {
  const [isMasterMode, setIsMasterMode] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const resume = useSelector((state: RootState) => state.resume);

  useEffect(() => {
    // Check if we're in master mode
    const urlParams = new URLSearchParams(window.location.search);
    const master = urlParams.get('master');
    const resumeId = urlParams.get('resumeId');
    const jobId = urlParams.get('jobId');
    
    // Only show master mode if it's explicitly master=true AND not a tailored resume
    setIsMasterMode(master === 'true' && !resumeId && !jobId);

    // Get user info from localStorage or URL
    const getUserInfo = () => {
      // Check for user info in URL parameters
      const userInfoParam = urlParams.get('userInfo');
      if (userInfoParam) {
        try {
          const decoded = JSON.parse(decodeURIComponent(userInfoParam));
          return decoded;
        } catch (err) {
          console.error('Failed to parse user info:', err);
        }
      }
      
      // Check localStorage for stored user info
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        try {
          return JSON.parse(storedUserInfo);
        } catch (err) {
          console.error('Failed to parse stored user info:', err);
        }
      }
      
      return null;
    };

    const user = getUserInfo();
    setUserInfo(user);
  }, []);

  const saveMasterResume = async () => {
    if (!userInfo?.email) {
      alert('Please log in to save your master resume');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Saving master resume...');

      const response = await fetch('/api/master-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userInfo.email,
          resumeData: resume
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save master resume');
      }

      const result = await response.json();
      console.log('✅ Master resume saved:', result);
      setSaved(true);
      
      // Show success message
      setTimeout(() => {
        setSaved(false);
      }, 3000);

    } catch (error) {
      console.error('❌ Error saving master resume:', error);
      alert(`Failed to save master resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isMasterMode) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Master Resume Header */}
      <div className="bg-purple-600 text-white px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-4">
          <span className="font-semibold">📝 Master Resume Mode</span>
          <button
            onClick={saveMasterResume}
            disabled={saving}
            className={`px-4 py-1 rounded-md text-sm font-medium ${
              saving 
                ? 'bg-purple-400 cursor-not-allowed' 
                : saved 
                  ? 'bg-green-500' 
                  : 'bg-white text-purple-600 hover:bg-gray-100'
            }`}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Master Resume'}
          </button>
        </div>
        <p className="text-sm text-purple-100 mt-1">
          This will be your base resume for creating tailored versions for specific jobs
        </p>
      </div>
      
      {children}
    </div>
  );
};
