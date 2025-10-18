// openresume/src/app/api/master-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, resumeData } = body;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }
    
    if (!resumeData) {
      return NextResponse.json({ error: 'resumeData is required' }, { status: 400 });
    }
    
    console.log('💾 Saving master resume for user:', userEmail);
    
    // Proxy request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://backend:5050';
    const backendResponse = await fetch(`${backendUrl}/api/openresume/master-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userEmail, resumeData }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('❌ Backend API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to save master resume', details: errorData },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    console.log('✅ Master resume saved:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving master resume:', error);
    return NextResponse.json(
      { error: 'Failed to save master resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail parameter is required' }, { status: 400 });
    }
    
    console.log('📖 Fetching master resume for user:', userEmail);
    
    // Proxy request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://backend:5050';
    const backendResponse = await fetch(`${backendUrl}/api/openresume/master-resume?userEmail=${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('❌ Backend API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch master resume', details: errorData },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    console.log('✅ Master resume fetched:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching master resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
