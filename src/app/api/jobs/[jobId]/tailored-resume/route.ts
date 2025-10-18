// openresume/src/app/api/jobs/[jobId]/tailored-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = parseInt(params.jobId);
    const body = await request.json();
    const { userEmail } = body;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }
    
    // Proxy request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://backend:5050';
    const backendResponse = await fetch(`${backendUrl}/api/openresume/jobs/${jobId}/tailored-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userEmail }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('❌ Backend API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create tailored resume', details: errorData },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    console.log('✅ Tailored resume created:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating tailored resume:', error);
    return NextResponse.json(
      { error: 'Failed to create tailored resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = parseInt(params.jobId);
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail parameter is required' }, { status: 400 });
    }
    
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