<!-- efe9bede-fb7a-488a-8167-876de0573a0a 589e90f4-85cf-4b7f-b341-3b81792f5914 -->
# AI-Powered Resume Customization Plan

## Overview

Add AI analysis and customization capabilities to tailored resumes, allowing users to get compatibility ratings, view suggestions for improvement, and apply changes with a side-by-side diff interface.

## Backend Implementation

### 1. Extend Resume Tailoring Service

**File:** `backend/app/services/resume_tailoring/tailoring_service.py`

Add new method `analyze_resume_for_customization()` that:

- Takes existing tailored resume + job data
- Calls GPT-4 with comprehensive analysis prompt
- Returns structured analysis with:
  - Overall match score (0-100)
  - Section-specific scores (bio, work experience, education, projects, skills)
  - Keyword analysis (required vs found)
  - Missing skills
  - ATS optimization suggestions
  - Specific improvement suggestions per section

Add method `generate_improved_content()` that:

- Takes a specific section and suggestion
- Generates improved content using GPT-4
- Returns both original and suggested content for diff view

### 2. Create New API Routes

**File:** `backend/app/routes/resume_tailoring_routes.py`

Add routes:

- `POST /api/resume-tailoring/analyze` - Analyze existing tailored resume
  - Input: `resume_version_id`, `job_id`
  - Output: Complete analysis object with scores and suggestions

- `POST /api/resume-tailoring/generate-suggestion` - Generate improved content for a section
  - Input: `resume_version_id`, `section_type`, `section_id`, `suggestion_text`
  - Output: Original content, suggested content, reasoning

- `POST /api/resume-tailoring/apply-suggestions` - Apply approved suggestions
  - Input: `resume_version_id`, `approved_suggestions[]`
  - Output: Updated resume version

Update existing route handler imports and ensure they work with the extended service.

### 3. Update Database Models

**File:** `backend/app/models/resume_analyses.py`

Add new fields to `ResumeAnalysis` model:

- `section_scores` (JSON): Individual scores for each section
- `ats_keywords` (JSON): Keyword analysis data
- `ats_optimization_tips` (JSON): ATS-specific suggestions

Ensure backward compatibility with existing analyses.

### 4. Register Routes

**File:** `backend/app/__init__.py`

Import and register `resume_tailoring_bp` blueprint if not already registered.

## Frontend Implementation (OpenResume)

### 5. Create AI Customization Side Panel Component

**File:** `openresume/src/app/components/AICustomizationPanel.tsx`

Create collapsible side panel with:

- Header with "Customize with AI" title
- Loading state during analysis
- Compatibility score display (circular progress, color-coded)
- Section-by-section scores (bio, experience, education, projects, skills)
- Keyword match visualization
- Missing skills chips
- ATS optimization tips
- Expandable suggestion cards per section

### 6. Create Suggestion Card with Diff View

**File:** `openresume/src/app/components/SuggestionCard.tsx`

Card component showing:

- Section name and type
- Priority indicator (1-5 stars/badges)
- Reasoning for the change
- Side-by-side diff view (original vs suggested)
- Accept/Reject buttons
- Loading state during content generation

Use a diff library like `react-diff-viewer-continued` or implement custom diff highlighting.

### 7. Modify TailoredResumeWrapper

**File:** `openresume/src/app/components/TailoredResumeWrapper.tsx`

Add:

- "Customize with AI" button in the header bar
- State management for panel visibility
- State management for analysis data
- State management for selected/approved suggestions
- Handler to fetch analysis when button clicked
- Handler to apply approved suggestions
- Layout adjustment to accommodate side panel (flexbox)

Update layout to support side panel:

```tsx
<div className="flex">
  <div className="flex-1">{children}</div>
  {showAIPanel && <AICustomizationPanel />}
</div>
```

### 8. Create API Service Functions

**File:** `openresume/src/lib/api/resumeCustomization.ts` (new file)

Add functions:

- `analyzeResumeForCustomization(resumeVersionId, jobId)`
- `generateSuggestionContent(resumeVersionId, sectionType, sectionId, suggestion)`
- `applySuggestionsToResume(resumeVersionId, approvedSuggestions)`

### 9. Update State Management

**File:** `openresume/src/lib/redux/resumeSlice.ts` (if needed)

Add actions for:

- Setting analysis data
- Tracking pending suggestions
- Applying suggestions to resume state

Alternatively, use React state if Redux is not necessary for this feature.

## Styling

### 10. Add Component Styles

Create styles for:

- Side panel (fixed width ~400px, slide-in animation)
- Compatibility score display (circular progress)
- Section score cards
- Diff view (syntax highlighting, side-by-side layout)
- Suggestion cards (expandable, hover states)
- Accept/Reject buttons (color-coded)

Use Tailwind CSS classes consistent with existing OpenResume styling.

## Testing Considerations

- Test with various resume lengths and job descriptions
- Ensure analysis handles missing sections gracefully
- Test diff view with long text content
- Verify suggestion application updates both UI and database
- Test panel responsiveness and mobile behavior
- Ensure backward compatibility with existing tailored resumes (no analysis)

## Key Files Modified/Created

**Backend:**

- `backend/app/services/resume_tailoring/tailoring_service.py` - extend
- `backend/app/routes/resume_tailoring_routes.py` - extend
- `backend/app/models/resume_analyses.py` - extend (optional migration)
- `backend/app/__init__.py` - register blueprint

**Frontend:**

- `openresume/src/app/components/AICustomizationPanel.tsx` - new
- `openresume/src/app/components/SuggestionCard.tsx` - new
- `openresume/src/app/components/TailoredResumeWrapper.tsx` - modify
- `openresume/src/lib/api/resumeCustomization.ts` - new

## Implementation Notes

1. Use existing `RESUME_TAILORING_FUNCTIONS` schema as base, extend for detailed analysis
2. Reuse OpenAI client setup from existing service
3. Store analysis results in existing `ResumeAnalysis` table
4. Generate suggestions on-demand to minimize API costs
5. Allow users to accept/reject suggestions individually before applying
6. Maintain original resume data - create new version when suggestions applied

### To-dos

- [ ] Add comprehensive resume analysis method to ResumeTailoringService with detailed scoring and suggestions
- [ ] Add method to generate improved content for specific resume sections
- [ ] Create API routes for analysis, suggestion generation, and applying suggestions
- [ ] Extend ResumeAnalysis model with section scores and ATS data fields
- [ ] Create API service functions for resume customization endpoints
- [ ] Build AICustomizationPanel component with scores, suggestions, and controls
- [ ] Create SuggestionCard component with side-by-side diff view
- [ ] Integrate AI customization button and panel into TailoredResumeWrapper
- [ ] Implement suggestion application logic to update resume data
- [ ] Add styling for all new components with animations and responsive design