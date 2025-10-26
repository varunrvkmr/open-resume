"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  XMarkIcon, 
  SparklesIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { SuggestionCard } from './SuggestionCard';
import { 
  analyzeResumeForCustomization, 
  generateSuggestionContent, 
  applySuggestionsToResume,
  getResumeAnalysis,
  type ResumeAnalysis 
} from '../../lib/api/resumeCustomization';

interface AICustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  resumeVersionId: number;
  jobId: number;
  onResumeUpdated?: (newResumeVersionId: number) => void;
}

// Circular progress component for compatibility score
const CircularProgress: React.FC<{ score: number; size?: number }> = ({ score, size = 120 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor(score)}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: getScoreColor(score) }}>
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
};

// Section score component
const SectionScore: React.FC<{ 
  section: string; 
  score: number; 
  onGenerateSuggestion: (section: string, suggestion: string) => void;
  suggestions: any[];
}> = ({ section, score, onGenerateSuggestion, suggestions }) => {
  const getSectionDisplayName = (section: string) => {
    const sectionNames: { [key: string]: string } = {
      'bio': 'Professional Summary',
      'work_experience': 'Work Experience',
      'education': 'Education',
      'projects': 'Projects',
      'skills': 'Skills'
    };
    return sectionNames[section] || section;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const sectionSuggestions = suggestions.filter(s => s.section === section);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{getSectionDisplayName(section)}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(score)}`}>
          {Math.round(score * 100)}%
        </span>
      </div>
      
      {sectionSuggestions.length > 0 && (
        <div className="mt-3 space-y-2">
          {sectionSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onGenerateSuggestion(section, suggestion.suggestion)}
              className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" />
                <span className="truncate">{suggestion.suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const AICustomizationPanel: React.FC<AICustomizationPanelProps> = ({
  isOpen,
  onClose,
  resumeVersionId,
  jobId,
  onResumeUpdated
}) => {
  const [activeResumeVersionId, setActiveResumeVersionId] = useState<number | null>(resumeVersionId);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingSuggestions, setGeneratingSuggestions] = useState<Set<string>>(new Set());
  const [suggestionCards, setSuggestionCards] = useState<any[]>([]);
  const [processingSuggestionIds, setProcessingSuggestionIds] = useState<Set<number>>(new Set());
  const [suggestionErrors, setSuggestionErrors] = useState<Record<number, string | null>>({});

  useEffect(() => {
    setActiveResumeVersionId(resumeVersionId);
  }, [resumeVersionId]);

  const loadAnalysis = useCallback(async (targetResumeVersionId: number) => {
    if (!targetResumeVersionId) return;
    setLoading(true);
    setError(null);
    
    try {
      // First try to get existing analysis
      const existingResult = await getResumeAnalysis(targetResumeVersionId, jobId);
      
      if (existingResult.success && existingResult.analysis) {
        setAnalysis(existingResult.analysis);
      } else {
        // If no existing analysis, create new one
        const newResult = await analyzeResumeForCustomization(targetResumeVersionId, jobId);
        
        if (newResult.success && newResult.analysis) {
          setAnalysis(newResult.analysis);
        } else {
          throw new Error(newResult.error || 'Failed to analyze resume');
        }
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Load analysis when panel opens
  useEffect(() => {
    if (isOpen && activeResumeVersionId && jobId) {
      loadAnalysis(activeResumeVersionId);
    }
  }, [isOpen, activeResumeVersionId, jobId, loadAnalysis]);

  const handleGenerateSuggestion = async (section: string, suggestionText: string) => {
    const suggestionKey = `${section}-${suggestionText}`;
    setGeneratingSuggestions(prev => new Set(prev).add(suggestionKey));
    
    try {
      const targetResumeVersionId = activeResumeVersionId ?? resumeVersionId;
      if (!targetResumeVersionId) {
        throw new Error('Resume version not available for generating suggestions');
      }

      const result = await generateSuggestionContent(
        targetResumeVersionId,
        section,
        'auto', // We'll use 'auto' as section ID for now
        suggestionText
      );
      
      if (result.success) {
        const newSuggestionCard = {
          id: Date.now(),
          section,
          suggestion: suggestionText,
          originalContent: result.original_content,
          improvedContent: result.improved_content,
          explanation: result.explanation,
          sectionType: section,
          sectionId: result.section_id || 'auto'
        };
        
        setSuggestionCards(prev => [...prev, newSuggestionCard]);
      } else {
        throw new Error(result.error || 'Failed to generate suggestion');
      }
    } catch (err) {
      console.error('Error generating suggestion:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate suggestion');
    } finally {
      setGeneratingSuggestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionKey);
        return newSet;
      });
    }
  };

  const handleAcceptSuggestion = async (suggestionCard: any) => {
    const targetResumeVersionId = activeResumeVersionId ?? resumeVersionId;
    if (!targetResumeVersionId) {
      throw new Error('Resume version not available for applying suggestions');
    }

    setSuggestionErrors(prev => ({ ...prev, [suggestionCard.id]: null }));
    setProcessingSuggestionIds(prev => {
      const next = new Set(prev);
      next.add(suggestionCard.id);
      return next;
    });

    try {
      const result = await applySuggestionsToResume(targetResumeVersionId, [suggestionCard]);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to apply suggestion');
      }

      const newVersionId = result.new_resume_version_id || targetResumeVersionId!;
      setActiveResumeVersionId(newVersionId);

      // Remove the applied card
      setSuggestionCards(prev => prev.filter(card => card.id !== suggestionCard.id));

      if (onResumeUpdated) {
        onResumeUpdated(newVersionId);
      }

      await loadAnalysis(newVersionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply suggestion';
      setSuggestionErrors(prev => ({ ...prev, [suggestionCard.id]: message }));
      throw err;
    } finally {
      setProcessingSuggestionIds(prev => {
        const next = new Set(prev);
        next.delete(suggestionCard.id);
        return next;
      });
    }
  };

  const handleRejectSuggestion = (suggestionCard: any) => {
    setSuggestionErrors(prev => {
      const { [suggestionCard.id]: _, ...rest } = prev;
      return rest;
    });
    setSuggestionCards(prev => prev.filter(card => card.id !== suggestionCard.id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Customization</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Analyzing your resume...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              <h3 className="font-medium text-red-800">Analysis Error</h3>
            </div>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={loadAnalysis}
              className="mt-3 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        ) : analysis ? (
          <>
            {/* Overall Compatibility Score */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Compatibility Score</h3>
              <CircularProgress score={analysis.overall_match_score * 100} />
              <p className="text-sm text-gray-600 mt-2">
                Overall match with job requirements
              </p>
            </div>

            {/* Section Scores */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                Section Analysis
              </h3>
              <div className="space-y-3">
                {Object.entries(analysis.section_scores || {}).map(([section, score]: [string, number]) => (
                  <SectionScore
                    key={section}
                    section={section}
                    score={score}
                    onGenerateSuggestion={handleGenerateSuggestion}
                    suggestions={analysis.suggested_improvements || []}
                  />
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            {analysis.missing_skills && analysis.missing_skills.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Missing Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.missing_skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full border border-orange-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ATS Optimization Tips */}
            {analysis.ats_optimization_tips && analysis.ats_optimization_tips.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">ATS Optimization</h3>
                <div className="space-y-2">
                  {analysis.ats_optimization_tips.map((tip: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestion Cards */}
            {suggestionCards.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Generated Suggestions</h3>
                <div className="space-y-4">
                  {suggestionCards.map((card) => (
                    <SuggestionCard
                      key={card.id}
                      suggestion={{
                        section: card.section,
                        priority: 3, // Default priority
                        suggestion: card.suggestion,
                        reasoning: 'AI-generated improvement'
                      }}
                      originalContent={card.originalContent}
                      improvedContent={card.improvedContent}
                      explanation={card.explanation}
                      sectionType={card.sectionType}
                      sectionId={card.sectionId}
                      onAccept={() => handleAcceptSuggestion(card)}
                      onReject={() => handleRejectSuggestion(card)}
                      isGenerating={generatingSuggestions.has(`${card.section}-${card.suggestion}`)}
                      isProcessing={processingSuggestionIds.has(card.id)}
                      acceptError={suggestionErrors[card.id] || null}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
