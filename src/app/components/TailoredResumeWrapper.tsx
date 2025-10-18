"use client";
import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "lib/redux/store";
import { setResume, ensureProfileExists } from "lib/redux/resumeSlice";
import { useSaveStateToLocalStorageOnChange } from "lib/redux/hooks";

interface TailoredResumeWrapperProps {
  children: React.ReactNode;
}

export const TailoredResumeWrapper = ({ children }: TailoredResumeWrapperProps) => {
  const [isTailoredMode, setIsTailoredMode] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingAsMaster, setSavingAsMaster] = useState(false);
  const [savedAsMaster, setSavedAsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const resume = useSelector((state: RootState) => state.resume);
  const dispatch = useDispatch();

  // Conditionally enable/disable localStorage auto-save
  // Disable auto-save when in tailored mode to prevent overwriting master resume
  useEffect(() => {
    if (isTailoredMode) {
      console.log('🚫 Disabling localStorage auto-save for tailored resume mode');
      // We'll override the localStorage save behavior by preventing it
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        // Block resume data from being saved to localStorage in tailored mode
        if (key === 'resume' || key.includes('resume')) {
          console.log('🚫 Blocked localStorage save for resume data in tailored mode');
          return;
        }
        // Allow other localStorage operations
        return originalSetItem.call(this, key, value);
      };
      
      // Cleanup function to restore original behavior
      return () => {
        localStorage.setItem = originalSetItem;
        console.log('✅ Restored localStorage auto-save behavior');
      };
    }
  }, [isTailoredMode]);

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
    
    // Handle work experiences transformation
    const workExperiences = (openResumeData.work || []).map((work: any) => ({
      company: work.company || "",
      jobTitle: work.position || work.jobTitle || "",
      date: work.startDate || work.date || "",
      descriptions: work.summary ? [work.summary] : (work.descriptions || [])
    }));

    // Handle education transformation
    const educations = (openResumeData.education || []).map((edu: any) => ({
      school: edu.institution || edu.school || "",
      degree: edu.degree || "",
      date: edu.date || "",
      gpa: edu.gpa || "",
      descriptions: edu.summary ? [edu.summary] : (edu.descriptions || [])
    }));

    // Handle projects transformation
    const projects = (openResumeData.projects || []).map((project: any) => ({
      project: project.name || project.project || "",
      date: project.date || "",
      descriptions: project.summary ? [project.summary] : (project.descriptions || [])
    }));

    const transformedData = {
      profile: {
        name: basics.name || "",
        email: basics.email || "",
        phone: basics.phone || "",
        url: basics.url || "",
        summary: basics.summary || "",
        location: basics.location || ""
      },
      workExperiences: workExperiences,
      educations: educations,
      projects: projects,
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
          // Transform OpenResume format to Redux format
          const transformedData = transformOpenResumeToRedux(result.resume_data);
          const safeData = ensureProfileExists(transformedData);
          dispatch(setResume(safeData));
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
          // Transform OpenResume format to Redux format
          const transformedData = transformOpenResumeToRedux(result.resume_data);
          const safeData = ensureProfileExists(transformedData);
          dispatch(setResume(safeData));
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

  const loadResumeById = useCallback(async (user: any, resumeId: string) => {
    try {
      setLoading(true);
      console.log('📖 Loading resume by ID:', resumeId);

      const response = await fetch(`/api/resume-versions/${resumeId}?userEmail=${encodeURIComponent(user.email)}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Resume loaded by ID:', result);
        
        // Load the resume data into Redux store
        if (result.resume_data) {
          // Transform OpenResume format to Redux format
          const transformedData = transformOpenResumeToRedux(result.resume_data);
          const safeData = ensureProfileExists(transformedData);
          dispatch(setResume(safeData));
        }
      } else if (response.status === 404) {
        console.log('📝 No resume found with ID, starting with master resume');
        // Load master resume as fallback
        await loadMasterResume(user);
      } else {
        throw new Error('Failed to load resume by ID');
      }
    } catch (error) {
      console.error('❌ Error loading resume by ID:', error);
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
    
    console.log('🔍 TailoredResumeWrapper - URL params:', {
      resumeId,
      jobIdParam,
      fullUrl: window.location.href,
      search: window.location.search
    });
    
    // Show tailored mode if we have a resumeId AND a jobId
    // This ensures we only enter tailored mode when we have both pieces of information
    const shouldBeTailoredMode = !!(resumeId && jobIdParam);
    setIsTailoredMode(shouldBeTailoredMode);
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
    if (shouldBeTailoredMode && user && jobIdParam) {
      console.log('📝 Loading tailored resume for job:', jobIdParam);
      loadTailoredResume(user, jobIdParam);
    } else if (resumeId && !jobIdParam && user) {
      // If we have resumeId but no jobId, try to load the resume by ID
      console.log('📝 Loading resume by ID:', resumeId);
      loadResumeById(user, resumeId);
    } else {
      setLoading(false);
    }
  }, [loadTailoredResume, loadMasterResume, loadResumeById]);

  const saveTailoredResume = async () => {
    if (!userInfo?.email) {
      alert('Please log in to save your tailored resume');
      return;
    }
    
    if (!jobId) {
      alert('No job ID available. Use "Save as Master" instead.');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Saving tailored resume for job:', jobId);

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

      console.log('🔄 Transformed resume data for API:', openResumeData);

      const response = await fetch('/api/tailored-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userInfo.email,
          jobId: jobId,
          resumeData: openResumeData
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

  const saveAsMasterResume = async () => {
    if (!userInfo?.email) {
      alert('Please log in to save as master resume');
      return;
    }

    try {
      setSavingAsMaster(true);
      console.log('💾 Saving current resume as master resume...');

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
        throw new Error(errorData.error || 'Failed to save as master resume');
      }

      const result = await response.json();
      console.log('✅ Saved as master resume:', result);
      setSavedAsMaster(true);
      
      // Show success message
      setTimeout(() => {
        setSavedAsMaster(false);
      }, 3000);

    } catch (error) {
      console.error('❌ Error saving as master resume:', error);
      alert(`Failed to save as master resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSavingAsMaster(false);
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
          <button
            onClick={saveAsMasterResume}
            disabled={savingAsMaster}
            className={`px-4 py-1 rounded-md text-sm font-medium ${
              savingAsMaster 
                ? 'bg-purple-400 cursor-not-allowed' 
                : savedAsMaster 
                  ? 'bg-green-500' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {savingAsMaster ? 'Saving...' : savedAsMaster ? '✓ Saved as Master!' : 'Save as Master'}
          </button>
        </div>
        <p className="text-sm text-blue-100 mt-1">
          This resume is tailored specifically for this job application
        </p>
        <p className="text-xs text-blue-200 mt-1">
          🔒 Auto-save disabled to protect your master resume
        </p>
      </div>
      
      {children}
    </div>
  );
};
