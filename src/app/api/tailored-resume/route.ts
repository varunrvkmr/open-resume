import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, jobId, resumeData } = body;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }
    
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }
    
    if (!resumeData) {
      return NextResponse.json({ error: 'resumeData is required' }, { status: 400 });
    }
    
    console.log('💾 Saving tailored resume for job:', jobId, 'user:', userEmail);
    
    // Proxy request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://backend:5050';
    const backendResponse = await fetch(`${backendUrl}/api/openresume/tailored-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail,
        jobId,
        resumeData
      }),
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

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE request received');
    const rawBody = await request.text();
    let userEmail: string | undefined;
    let jobId: number | string | undefined;

    if (rawBody) {
      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch (parseError) {
        console.error('❌ Failed to parse request body:', parseError);
        return NextResponse.json(
          { error: 'Request body must be valid JSON' },
          { status: 400 }
        );
      }

      if (typeof parsedBody !== 'object' || parsedBody === null) {
        console.log('❌ Parsed body is not an object:', parsedBody);
        return NextResponse.json(
          { error: 'Request body must be a JSON object' },
          { status: 400 }
        );
      }

      console.log('🗑️ Request body:', parsedBody);
      userEmail = (parsedBody as { userEmail?: string }).userEmail;
      jobId = (parsedBody as { jobId?: number | string }).jobId;
    } else {
      console.log('⚠️ No JSON body provided, falling back to search params');
    }

    if (!userEmail || !jobId) {
      const searchParams = request.nextUrl.searchParams;
      userEmail = userEmail ?? searchParams.get('userEmail') ?? undefined;
      jobId = jobId ?? searchParams.get('jobId') ?? undefined;
    }
    
    let normalizedJobId: number | undefined;
    if (typeof jobId === 'string') {
      const parsed = Number.parseInt(jobId, 10);
      if (Number.isNaN(parsed)) {
        console.log('❌ jobId query parameter is not a number:', jobId);
        return NextResponse.json({ error: 'jobId must be a number' }, { status: 400 });
      }
      normalizedJobId = parsed;
    } else if (typeof jobId === 'number') {
      normalizedJobId = jobId;
    }

    if (!userEmail) {
      console.log('❌ Missing userEmail');
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }
    
    if (!normalizedJobId && normalizedJobId !== 0) {
      console.log('❌ Missing jobId');
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }
    
    console.log('🗑️ Deleting tailored resume for job:', jobId, 'user:', userEmail);
    
    // Proxy request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://backend:5050';
    console.log('🗑️ Making request to backend:', `${backendUrl}/api/openresume/tailored-resume`);
    
    const backendResponse = await fetch(`${backendUrl}/api/openresume/tailored-resume`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail,
        jobId: normalizedJobId
      }),
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    console.log('🗑️ Backend response status:', backendResponse.status);
    console.log('🗑️ Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));

    if (!backendResponse.ok) {
      let errorData = {};
      try {
        const text = await backendResponse.text();
        if (text) {
          errorData = JSON.parse(text);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
        errorData = { error: `Server error (${backendResponse.status}): ${backendResponse.statusText}` };
      }
      console.error('❌ Backend API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to delete tailored resume', details: errorData },
        { status: backendResponse.status }
      );
    }

    // Get the response text first to debug
    const responseText = await backendResponse.text();
    console.log('🗑️ Backend response text:', responseText);
    
    if (!responseText) {
      console.log('❌ Empty response from backend');
      return NextResponse.json(
        { error: 'Empty response from backend' },
        { status: 500 }
      );
    }
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response:', parseError);
      console.log('❌ Raw response:', responseText);
      return NextResponse.json(
        { error: 'Invalid JSON response from backend', details: responseText },
        { status: 500 }
      );
    }
    
    console.log('✅ Tailored resume deleted:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting tailored resume:', error);
    return NextResponse.json(
      { error: 'Failed to delete tailored resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
