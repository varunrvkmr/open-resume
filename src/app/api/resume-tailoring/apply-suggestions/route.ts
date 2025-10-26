import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to the main backend
    const backendResponse = await fetch('http://jobtrackr-backend-1:5050/api/resume-tailoring/apply-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward any authentication headers
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(([key]) => 
            key.toLowerCase().startsWith('authorization') || 
            key.toLowerCase() === 'cookie'
          )
        ),
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();
    
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error in apply-suggestions proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
