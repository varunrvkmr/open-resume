import { NextRequest, NextResponse } from 'next/server';

// Mock data - replace with actual database calls
const mockJobs = [
  {
    id: 1,
    title: "Senior Software Engineer",
    company: "Tech Corp",
    location: "San Francisco, CA",
    status: "Applied",
    date_applied: "2024-01-15",
    has_tailored_resume: true,
    tailored_resume_id: 1
  },
  {
    id: 2,
    title: "Full Stack Developer",
    company: "StartupXYZ",
    location: "Remote",
    status: "Interview",
    date_applied: "2024-01-10",
    has_tailored_resume: false
  },
  {
    id: 3,
    title: "Frontend Engineer",
    company: "Design Co",
    location: "New York, NY",
    status: "Applied",
    date_applied: "2024-01-08",
    has_tailored_resume: true,
    tailored_resume_id: 2
  }
];

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query
    // const jobs = await db.query('SELECT * FROM jobs WHERE user_id = ?', [userId]);
    
    // For now, return mock data
    return NextResponse.json(mockJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // TODO: Implement job creation logic
    // const newJob = await db.query(
    //   'INSERT INTO jobs (title, company, location, status, date_applied, user_id) VALUES (?, ?, ?, ?, ?, ?)',
    //   [body.title, body.company, body.location, body.status, body.date_applied, userId]
    // );
    
    const newJob = {
      id: Date.now(),
      ...body,
      has_tailored_resume: false
    };
    
    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
