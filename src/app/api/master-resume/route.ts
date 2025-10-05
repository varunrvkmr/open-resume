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
    
    // Call backend API to save master resume
    const response = await fetch(`${process.env.BACKEND_URL}/api/openresume/master-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userEmail, resumeData })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Master resume saved:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving master resume:', error);
    return NextResponse.json(
      { error: 'Failed to save master resume' },
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
    
    // Call backend API to get master resume
    const response = await fetch(`${process.env.BACKEND_URL}/api/openresume/master-resume?userEmail=${encodeURIComponent(userEmail)}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'No master resume found' }, { status: 404 });
      }
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Master resume fetched:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching master resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master resume' },
      { status: 500 }
    );
  }
}
