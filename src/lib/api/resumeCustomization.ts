// API service functions for resume customization features

export interface ResumeAnalysis {
  id: number;
  overall_match_score: number;
  section_scores: {
    bio: number;
    work_experience: number;
    education: number;
    projects: number;
    skills: number;
  };
  keyword_matches: {
    matched: string[];
    missing: string[];
    match_percentage: number;
  };
  missing_skills: string[];
  suggested_improvements: Array<{
    section: string;
    priority: number;
    suggestion: string;
    reasoning: string;
  }>;
  ats_optimization_tips: string[];
  job_requirements_analysis: {
    required_skills: string[];
    preferred_qualifications: string[];
    key_responsibilities: string[];
  };
  analysis_model: string;
  analysis_tokens_used: number;
  analysis_duration_ms: number;
  created_at: string;
}

export interface SuggestionContent {
  success: boolean;
  original_content: any;
  improved_content: any;
  explanation: string;
  section_type: string;
  section_id: string;
  error?: string;
}

export interface ApplySuggestionsResult {
  success: boolean;
  new_resume_version_id: number;
  applied_changes_count: number;
  applied_changes: any[];
  error?: string;
}

/**
 * Analyze a tailored resume for AI customization suggestions
 */
export async function analyzeResumeForCustomization(
  resumeVersionId: number,
  jobId: number
): Promise<{ success: boolean; analysis?: ResumeAnalysis; error?: string }> {
  try {
    console.log('🔍 Analyzing resume for customization:', { resumeVersionId, jobId });

    const response = await fetch('/api/resume-tailoring/analyze-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_version_id: resumeVersionId,
        job_id: jobId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Resume analysis completed:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error analyzing resume:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate improved content for a specific resume section
 */
export async function generateSuggestionContent(
  resumeVersionId: number,
  sectionType: string,
  sectionId: string,
  suggestionText: string
): Promise<SuggestionContent> {
  try {
    console.log('🔄 Generating improved content:', { 
      resumeVersionId, 
      sectionType, 
      sectionId, 
      suggestionText 
    });

    const response = await fetch('/api/resume-tailoring/generate-suggestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_version_id: resumeVersionId,
        section_type: sectionType,
        section_id: sectionId,
        suggestion_text: suggestionText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Improved content generated:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error generating improved content:', error);
    return {
      success: false,
      original_content: null,
      improved_content: null,
      explanation: '',
      section_type: sectionType,
      section_id: sectionId,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Apply approved suggestions to create a new resume version
 */
export async function applySuggestionsToResume(
  resumeVersionId: number,
  approvedSuggestions: any[]
): Promise<ApplySuggestionsResult> {
  try {
    console.log('💾 Applying suggestions to resume:', { 
      resumeVersionId, 
      approvedSuggestionsCount: approvedSuggestions.length 
    });

    const response = await fetch('/api/resume-tailoring/apply-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_version_id: resumeVersionId,
        approved_suggestions: approvedSuggestions,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Suggestions applied successfully:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error applying suggestions:', error);
    return {
      success: false,
      new_resume_version_id: 0,
      applied_changes_count: 0,
      applied_changes: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get existing analysis for a resume version
 */
export async function getResumeAnalysis(
  resumeVersionId: number,
  jobId?: number
): Promise<{ success: boolean; analysis?: ResumeAnalysis; error?: string }> {
  try {
    console.log('📖 Getting existing analysis:', { resumeVersionId, jobId });
    const query = jobId !== undefined ? `?jobId=${encodeURIComponent(jobId)}` : '';

    const response = await fetch(`/api/resume-tailoring/get-analysis/${resumeVersionId}${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Analysis retrieved:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error getting analysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
