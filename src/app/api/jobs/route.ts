// openresume/src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user email and pagination parameters from query parameters
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '10';
    
    console.log('🔍 OpenResume API - userEmail:', userEmail, 'page:', page, 'per_page:', perPage);
    
    if (!userEmail) {
      console.log('❌ No userEmail provided');
      return NextResponse.json({ error: 'userEmail parameter is required' }, { status: 400 });
    }

    // Proxy request to backend with pagination parameters
    const backendUrl = process.env.BACKEND_URL || 'http://backend:5050';
    const backendResponse = await fetch(`${backendUrl}/api/openresume/jobs?userEmail=${encodeURIComponent(userEmail)}&page=${page}&per_page=${perPage}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('❌ Backend API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch jobs from backend', details: errorData },
        { status: backendResponse.status }
      );
    }

    const response = await backendResponse.json();
    console.log(`✅ Received ${response.jobs?.length || 0} jobs from backend (page ${response.pagination?.page || 1})`);
    
    return NextResponse.json(response);
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
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const body = await request.json();
    const { userEmail, ...jobData } = body;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    // Use optimized service to create job
    const job = await JobService.createJob(userEmail, jobData);
    console.log(`✅ Created job ${job.id} for user ${userEmail}`);
    
    return NextResponse.json({
      success: true,
      job: job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}