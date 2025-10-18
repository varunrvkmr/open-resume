// openresume/src/app/api/tailored-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, resumeData, jobId } = body;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }
    
    if (!resumeData) {
      return NextResponse.json({ error: 'resumeData is required' }, { status: 400 });
    }
    
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }
    
    console.log('💾 Saving tailored resume for job:', jobId, 'user:', userEmail);
    
    // Proxy request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://backend:5050';
    const backendResponse = await fetch(`${backendUrl}/api/openresume/tailored-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userEmail, resumeData, jobId }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('❌ Backend API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to save tailored resume', details: errorData },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    console.log('✅ Tailored resume saved:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving tailored resume:', error);
    return NextResponse.json(
      { error: 'Failed to save tailored resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const jobId = searchParams.get('jobId');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail parameter is required' }, { status: 400 });
    }
    
    if (!jobId) {
      return NextResponse.json({ error: 'jobId parameter is required' }, { status: 400 });
    }
    
    console.log('📖 Fetching tailored resume for job:', jobId, 'user:', userEmail);
    
    // Proxy request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://backend:5050';
    const backendResponse = await fetch(`${backendUrl}/api/openresume/tailored-resume?userEmail=${encodeURIComponent(userEmail)}&jobId=${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('❌ Backend API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch tailored resume', details: errorData },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    console.log('✅ Tailored resume fetched:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching tailored resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tailored resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
