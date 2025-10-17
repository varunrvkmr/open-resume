"use client";
import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "lib/redux/store";
import { setResume, ensureProfileExists } from "lib/redux/resumeSlice";

interface MasterResumeWrapperProps {
  children: React.ReactNode;
}

export const MasterResumeWrapper = ({ children }: MasterResumeWrapperProps) => {
  const [isMasterMode, setIsMasterMode] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const resume = useSelector((state: RootState) => state.resume);
  const dispatch = useDispatch();

  // Transform OpenResume format to Redux format
  const transformOpenResumeToRedux = (openResumeData: any) => {
    console.log('🔄 Transforming OpenResume data:', openResumeData);
    const basics = openResumeData.basics || {};
    console.log('📋 Basics data:', basics);
    
    // Handle skills transformation - ensure it has the correct Redux structure
    let skillsData = { featuredSkills: [], descriptions: [] };
    if (openResumeData.skills) {
      if (Array.isArray(openResumeData.skills)) {
        // If skills is an array, convert to Redux format
        skillsData = {
          featuredSkills: openResumeData.skills.map((skill: any) => ({
            skill: skill.skill || skill.name || skill,
            rating: skill.rating || 4
          })),
          descriptions: []
        };
      } else if (openResumeData.skills.featuredSkills || openResumeData.skills.descriptions) {
        // If it's already in Redux format, use it
        skillsData = openResumeData.skills;
      }
    }
    
    // Handle custom transformation - ensure it has the correct Redux structure
    let customData = { descriptions: [] };
    if (openResumeData.custom) {
      if (Array.isArray(openResumeData.custom)) {
        customData = { descriptions: openResumeData.custom };
      } else if (openResumeData.custom.descriptions) {
        customData = openResumeData.custom;
      }
    }
    
    const transformedData = {
      profile: {
        name: basics.name || "",
        email: basics.email || "",
        phone: basics.phone || "",
        url: basics.url || "",
        summary: basics.summary || "",
        location: basics.location || ""
      },
      workExperiences: openResumeData.work || [],
      educations: openResumeData.education || [],
      projects: openResumeData.projects || [],
      skills: skillsData,
      custom: customData
    };
    
    console.log('✅ Transformed data:', transformedData);
    console.log('📋 Transformed profile:', transformedData.profile);
    console.log('📋 Transformed skills:', transformedData.skills);
    console.log('📋 Transformed custom:', transformedData.custom);
    return transformedData;
  };

  const loadMasterResume = useCallback(async (user: any) => {
    try {
      setLoading(true);
      console.log('📖 Loading master resume from database...');

      const response = await fetch(`/api/master-resume?userEmail=${encodeURIComponent(user.email)}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Master resume loaded from DB:', result);
        console.log('📋 Raw resume_data from API:', result.resume_data);
        console.log('📋 Basics from API:', result.resume_data?.basics);
        console.log('📋 Work from API:', result.resume_data?.work);
        console.log('📋 Education from API:', result.resume_data?.education);
        
        if (result.resume_data) {
          // Transform OpenResume format to Redux format
          const transformedData = transformOpenResumeToRedux(result.resume_data);
          console.log('🔄 Transformed data for Redux:', transformedData);
          console.log('📋 Profile data:', transformedData.profile);
          console.log('📋 Work experiences:', transformedData.workExperiences);
          console.log('📋 Educations:', transformedData.educations);
          
          // Ensure profile exists before setting resume
          const safeData = ensureProfileExists(transformedData);
          console.log('🛡️ Safe data with ensured profile:', safeData);
          console.log('🛡️ Safe profile:', safeData.profile);
          console.log('🛡️ Safe work experiences:', safeData.workExperiences);
          console.log('🛡️ Safe work experiences length:', safeData.workExperiences?.length);
          console.log('🛡️ Safe educations:', safeData.educations);
          console.log('🛡️ Safe educations length:', safeData.educations?.length);
          
          // Load the master resume data into Redux store
          dispatch(setResume(safeData));
          
          // Force a re-render by dispatching again after a short delay
          setTimeout(() => {
            console.log('🔄 Force updating Redux state...');
            dispatch(setResume(safeData));
          }, 50);
        }
      } else if (response.status === 404) {
        console.log('📝 No master resume found in database, starting with empty form');
        // Keep the current Redux state (likely empty or from localStorage)
      } else {
        throw new Error('Failed to load master resume');
      }
    } catch (error) {
      console.error('❌ Error loading master resume:', error);
      // Keep the current Redux state on error
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Ensure database data loads after localStorage initialization
  useEffect(() => {
    if (isMasterMode && userInfo) {
      // Add a small delay to ensure localStorage loading completes first
      const timer = setTimeout(() => {
        console.log('🔄 Re-loading master resume after localStorage initialization...');
        loadMasterResume(userInfo);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isMasterMode, userInfo, loadMasterResume]);

  // Monitor Redux state changes
  useEffect(() => {
    console.log('🔍 MasterResumeWrapper - Current Redux state:', resume);
    console.log('🔍 MasterResumeWrapper - Profile in Redux:', resume?.profile);
    console.log('🔍 MasterResumeWrapper - Work experiences in Redux:', resume?.workExperiences);
    console.log('🔍 MasterResumeWrapper - Educations in Redux:', resume?.educations);
    console.log('🔍 MasterResumeWrapper - Skills in Redux:', resume?.skills);
    console.log('🔍 MasterResumeWrapper - Projects in Redux:', resume?.projects);
  }, [resume]);

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

    // Load master resume data if in master mode
    if (master === 'true' && !resumeId && !jobId && user) {
      loadMasterResume(user);
    } else {
      setLoading(false);
    }
  }, [loadMasterResume]);

  const saveMasterResume = async () => {
    if (!userInfo?.email) {
      alert('Please log in to save your master resume');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Saving master resume...');
      console.log('🔍 Current Redux state when saving:', resume);
      console.log('🔍 Profile in Redux when saving:', resume?.profile);

      // Transform Redux format to OpenResume format for API
      const profile = resume.profile || {};
      const openResumeData = {
        basics: {
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          url: profile.url || "",
          summary: profile.summary || "",
          location: profile.location || ""
        },
        work: resume.workExperiences,
        education: resume.educations,
        projects: resume.projects,
        skills: resume.skills,
        custom: resume.custom
      };

      console.log('💾 Saving master resume with data:', openResumeData);
      console.log('📋 Profile data being saved:', openResumeData.basics);

      const response = await fetch('/api/master-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userInfo.email,
          resumeData: openResumeData
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

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
