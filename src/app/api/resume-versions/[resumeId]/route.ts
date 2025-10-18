// openresume/src/app/api/resume-versions/[resumeId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { resumeId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const resumeId = params.resumeId;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail parameter is required' }, { status: 400 });
    }
    
    if (!resumeId) {
      return NextResponse.json({ error: 'resumeId parameter is required' }, { status: 400 });
    }
    
    console.log('📖 Fetching resume version by ID:', resumeId, 'user:', userEmail);
    
    // Proxy request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://backend:5050';
    const backendResponse = await fetch(`${backendUrl}/api/openresume/resume-versions/${resumeId}?userEmail=${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('❌ Backend API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch resume version', details: errorData },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    console.log('✅ Resume version fetched:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching resume version:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume version', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
