"use client";

import React, { useState } from 'react';
import { StarIcon, CheckIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface SuggestionCardProps {
  suggestion: {
    section: string;
    priority: number;
    suggestion: string;
    reasoning: string;
  };
  originalContent: any;
  improvedContent: any;
  explanation: string;
  sectionType: string;
  sectionId: string;
  onAccept: () => Promise<void>;
  onReject: () => void;
  isGenerating?: boolean;
  isProcessing?: boolean;
  acceptError?: string | null;
}

// Simple diff component for text comparison
const SimpleDiffView: React.FC<{ original: string; improved: string }> = ({ original, improved }) => {
  const originalLines = original.split('\n');
  const improvedLines = improved.split('\n');
  
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="space-y-2">
        <div className="font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Original</div>
        <div className="bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto">
          {originalLines.map((line, index) => (
            <div key={index} className="text-gray-700">{line || '\u00A0'}</div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Improved</div>
        <div className="bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto">
          {improvedLines.map((line, index) => (
            <div key={index} className="text-gray-700">{line || '\u00A0'}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Priority badge component
const PriorityBadge: React.FC<{ priority: number }> = ({ priority }) => {
  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-100 text-red-800 border-red-200';
    if (priority >= 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (priority >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getPriorityText = (priority: number) => {
    if (priority >= 4) return 'Critical';
    if (priority >= 3) return 'High';
    if (priority >= 2) return 'Medium';
    return 'Low';
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(priority)}`}>
      <StarIcon className="w-3 h-3 mr-1" />
      {getPriorityText(priority)}
    </span>
  );
};

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  originalContent,
  improvedContent,
  explanation,
  sectionType,
  sectionId,
  onAccept,
  onReject,
  isGenerating = false,
  isProcessing = false,
  acceptError = null
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleAccept = async () => {
    setLocalError(null);
    try {
      await onAccept();
      setIsAccepted(true);
      setIsRejected(false);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Failed to apply change');
    }
  };

  const handleReject = () => {
    setIsRejected(true);
    setIsAccepted(false);
    onReject();
  };

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

  const formatContentForDisplay = (content: any): string => {
    if (typeof content === 'string') {
      return content;
    }
    if (typeof content === 'object' && content !== null) {
      if (content.description) return content.description;
      if (content.summary) return content.summary;
      if (Array.isArray(content.descriptions)) {
        return content.descriptions.join('\n');
      }
      return JSON.stringify(content, null, 2);
    }
    return String(content);
  };

  const originalText = formatContentForDisplay(originalContent);
  const improvedText = formatContentForDisplay(improvedContent);

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 ${
      isAccepted ? 'border-green-300 bg-green-50' : 
      isRejected ? 'border-red-300 bg-red-50' : 
      'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">
              {getSectionDisplayName(sectionType)}
            </h4>
            <PriorityBadge priority={suggestion.priority} />
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {suggestion.suggestion}
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Reasoning */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded border-l-4 border-blue-400">
          <span className="font-medium">Why this change:</span> {suggestion.reasoning}
        </p>
      </div>

      {(acceptError || localError) && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {acceptError || localError}
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Explanation */}
          {explanation && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              <span className="font-medium">AI Explanation:</span> {explanation}
            </div>
          )}

          {/* Diff View */}
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Content Comparison</h5>
            <SimpleDiffView original={originalText} improved={improvedText} />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
        {isGenerating ? (
          <div className="flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Generating content...
          </div>
        ) : (
          <>
            <button
              onClick={handleReject}
              disabled={isAccepted || isRejected || isProcessing}
              className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isRejected 
                  ? 'bg-red-100 text-red-700 cursor-not-allowed' 
                  : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700'
              }`}
            >
              <XMarkIcon className="w-4 h-4 mr-1" />
              {isRejected ? 'Rejected' : 'Reject'}
            </button>
            <button
              onClick={handleAccept}
              disabled={isAccepted || isRejected || isProcessing}
              className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isAccepted 
                  ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                  : isProcessing
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Applying...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 mr-1" />
                  {isAccepted ? 'Accepted' : 'Accept'}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
