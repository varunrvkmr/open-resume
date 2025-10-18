# OpenResume Dedicated Backend

This document describes the new dedicated backend implementation for OpenResume that fixes the N+1 query performance issue.

## Overview

The OpenResume backend has been moved from the JobTrackr backend to a dedicated implementation within the OpenResume container. This provides:

1. **Performance Optimization**: Fixed the N+1 query problem that was causing slow job loading
2. **Separation of Concerns**: OpenResume now has its own optimized database queries
3. **Better Maintainability**: Dedicated backend logic for OpenResume-specific features

## Architecture

### Database Models
- **UserAuth**: User authentication data
- **JobPosting**: Job postings with optimized queries
- **ResumeVersion**: Resume versions (master and tailored)
- **UserMasterResume**: Master resume data

### Services
- **JobService**: Optimized job operations with fixed N+1 queries
- **ResumeService**: Resume management operations

### API Routes
- `/api/jobs` - Job operations (GET, POST)
- `/api/master-resume` - Master resume operations (GET, POST)
- `/api/tailored-resume` - Tailored resume operations (GET, POST)
- `/api/jobs/[jobId]/tailored-resume` - Job-specific tailored resume operations
- `/api/health` - Health check with database connectivity

## Performance Improvements

### Before (N+1 Query Problem)
```sql
-- 1 query to get jobs
SELECT * FROM job_posting WHERE user_auth_id = ?;

-- N additional queries (one per job)
SELECT * FROM resume_version WHERE user_auth_id = ? AND job_posting_id = ? AND is_master = false;
```

### After (Optimized Single Query)
```sql
-- Single query with LEFT JOIN
SELECT j.*, rv.id as tailored_resume_id
FROM job_posting j
LEFT JOIN resume_version rv ON j.id = rv.job_posting_id 
  AND rv.user_auth_id = j.user_auth_id 
  AND rv.is_master = false
WHERE j.user_auth_id = ?;
```

**Expected Performance Improvement**: 10-50x faster depending on the number of jobs.

## Environment Variables

The backend uses the same database as JobTrackr:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
# or
POSTGRES_URL=postgresql://user:password@host:port/database
```

## Database Connection

The backend connects directly to the JobTrackr database using Sequelize ORM with:
- Connection pooling
- SSL support for production
- Automatic model synchronization (development only)

## API Usage

### Get Jobs (Optimized)
```typescript
GET /api/jobs?userEmail=user@example.com
```

### Create Job
```typescript
POST /api/jobs
{
  "userEmail": "user@example.com",
  "company": "Google",
  "job_title": "Software Engineer",
  "location": "Mountain View, CA"
}
```

### Get Master Resume
```typescript
GET /api/master-resume?userEmail=user@example.com
```

### Save Master Resume
```typescript
POST /api/master-resume
{
  "userEmail": "user@example.com",
  "resumeData": { /* OpenResume format */ }
}
```

### Create Tailored Resume
```typescript
POST /api/jobs/123/tailored-resume
{
  "userEmail": "user@example.com"
}
```

## Health Check

```typescript
GET /api/health
```

Returns:
```json
{
  "status": "healthy",
  "database": "connected",
  "features": {
    "optimized_queries": true,
    "n1_query_fix": true,
    "dedicated_backend": true
  }
}
```

## Migration from JobTrackr Backend

The frontend automatically uses the new internal API routes instead of calling the JobTrackr backend. No frontend changes are required.

## Development

### Running Locally
```bash
cd openresume
npm install
npm run dev
```

### Testing Database Connection
Visit `/api/health` to verify database connectivity.

## Production Deployment

The backend is automatically included in the OpenResume container and uses the same database connection as JobTrackr. No additional configuration is required.
