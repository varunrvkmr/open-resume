// openresume/src/app/api/jobs/[jobId]/tailored-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    const body = await request.json();
    const { userEmail } = body;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }
    
    // Call your backend API
    const response = await fetch(`${process.env.BACKEND_URL}/api/openresume/jobs/${jobId}/tailored-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userEmail })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating tailored resume:', error);
    return NextResponse.json(
      { error: 'Failed to create tailored resume' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const jobId = params.jobId;
    
    // Call your backend API
    const response = await fetch(`${process.env.BACKEND_URL}/api/openresume/jobs/${jobId}/tailored-resume`, {
      headers: {
        'Authorization': authHeader
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tailored resume');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching tailored resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tailored resume' },
      { status: 500 }
    );
  }
}