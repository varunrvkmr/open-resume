import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { resumeVersionId: string } }
) {
  try {
    const { resumeVersionId } = params;
    const jobId = request.nextUrl.searchParams.get('jobId');
    const queryString = jobId ? `?job_id=${encodeURIComponent(jobId)}` : '';
    
    // Forward the request to the main backend
    const backendResponse = await fetch(`http://jobtrackr-backend-1:5050/api/resume-tailoring/get-analysis/${resumeVersionId}${queryString}`, {
      method: 'GET',
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
    });

    const data = await backendResponse.json();
    
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error in get-analysis proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
