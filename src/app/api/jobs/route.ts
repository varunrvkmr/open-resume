// openresume/src/app/api/jobs/route.ts
// openresume/src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user email from query parameters
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    console.log('🔍 OpenResume API - userEmail:', userEmail);
    
    if (!userEmail) {
      console.log('❌ No userEmail provided');
      return NextResponse.json({ error: 'userEmail parameter is required' }, { status: 400 });
    }

    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5050';
    console.log('🔧 Backend URL:', backendUrl);
    
    const fullUrl = `${backendUrl}/api/openresume/jobs?userEmail=${encodeURIComponent(userEmail)}`;
    console.log('📡 Calling backend:', fullUrl);
    
    // Call your backend API
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const jobs = await response.json();
    console.log(`✅ Received ${jobs.length} jobs from backend`);
    
    // Map backend fields to expected UI fields with safe defaults
    const mappedJobs = jobs.map((job: any) => ({
      id: job.id,
      title: job.title || 'Unknown Position',
      company: job.company || 'Unknown Company',
      location: job.location || 'Unknown Location',
      status: job.status || 'Unknown',
      date_applied: job.date_applied || job.applied_date || null,
      has_tailored_resume: Boolean(job.has_tailored_resume),
      tailored_resume_id: job.tailored_resume_id || null
    }));
    
    return NextResponse.json(mappedJobs);
  } catch (error) {
    console.error('❌ Error in OpenResume API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const body = await request.json();
    
    // Call your backend API
    const response = await fetch(`${process.env.BACKEND_URL}/api/openresume/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('Failed to create job in backend');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}