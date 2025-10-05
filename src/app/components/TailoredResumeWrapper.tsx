"use client";
import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "lib/redux/store";
import { setResume } from "lib/redux/resumeSlice";

interface TailoredResumeWrapperProps {
  children: React.ReactNode;
}

export const TailoredResumeWrapper = ({ children }: TailoredResumeWrapperProps) => {
  const [isTailoredMode, setIsTailoredMode] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const resume = useSelector((state: RootState) => state.resume);
  const dispatch = useDispatch();

  const loadMasterResume = useCallback(async (user: any) => {
    try {
      console.log('📖 Loading master resume as fallback');

      const response = await fetch(`/api/master-resume?userEmail=${encodeURIComponent(user.email)}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Master resume loaded:', result);
        
        if (result.resume_data) {
          dispatch(setResume(result.resume_data));
        }
      }
    } catch (error) {
      console.error('❌ Error loading master resume:', error);
    }
  }, [dispatch]);

  const loadTailoredResume = useCallback(async (user: any, jobId: string) => {
    try {
      setLoading(true);
      console.log('📖 Loading tailored resume for job:', jobId);

      const response = await fetch(`/api/tailored-resume?userEmail=${encodeURIComponent(user.email)}&jobId=${jobId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Tailored resume loaded:', result);
        
        // Load the tailored resume data into Redux store
        if (result.resume_data) {
          dispatch(setResume(result.resume_data));
        }
      } else if (response.status === 404) {
        console.log('📝 No tailored resume found, starting with master resume');
        // Load master resume as fallback
        await loadMasterResume(user);
      } else {
        throw new Error('Failed to load tailored resume');
      }
    } catch (error) {
      console.error('❌ Error loading tailored resume:', error);
      // Fallback to master resume
      await loadMasterResume(user);
    } finally {
      setLoading(false);
    }
  }, [dispatch, loadMasterResume]);

  useEffect(() => {
    // Check if we're in tailored mode
    const urlParams = new URLSearchParams(window.location.search);
    const resumeId = urlParams.get('resumeId');
    const jobIdParam = urlParams.get('jobId');
    
    setIsTailoredMode(!!resumeId && !!jobIdParam);
    setJobId(jobIdParam);

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

    // Load tailored resume data if in tailored mode
    if (isTailoredMode && user && jobIdParam) {
      loadTailoredResume(user, jobIdParam);
    } else {
      setLoading(false);
    }
  }, [isTailoredMode, loadTailoredResume]);

  const saveTailoredResume = async () => {
    if (!userInfo?.email || !jobId) {
      alert('Please log in to save your tailored resume');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Saving tailored resume for job:', jobId);

      const response = await fetch('/api/tailored-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userInfo.email,
          jobId: jobId,
          resumeData: resume
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save tailored resume');
      }

      const result = await response.json();
      console.log('✅ Tailored resume saved:', result);
      setSaved(true);
      
      // Show success message
      setTimeout(() => {
        setSaved(false);
      }, 3000);

    } catch (error) {
      console.error('❌ Error saving tailored resume:', error);
      alert(`Failed to save tailored resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isTailoredMode) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Tailored Resume Header */}
      <div className="bg-blue-600 text-white px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-4">
          <span className="font-semibold">🎯 Tailored Resume Mode</span>
          <button
            onClick={saveTailoredResume}
            disabled={saving}
            className={`px-4 py-1 rounded-md text-sm font-medium ${
              saving 
                ? 'bg-blue-400 cursor-not-allowed' 
                : saved 
                  ? 'bg-green-500' 
                  : 'bg-white text-blue-600 hover:bg-gray-100'
            }`}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Tailored Resume'}
          </button>
        </div>
        <p className="text-sm text-blue-100 mt-1">
          This resume is tailored specifically for this job application
        </p>
      </div>
      
      {children}
    </div>
  );
};
