// openresume/src/app/api/tailored-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ResumeService } from '../../../lib/services/resumeService';
import { testConnection } from '../../../lib/database/connection';

export async function POST(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

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
    
    // Use optimized service to save tailored resume
    const result = await ResumeService.saveTailoredResume(userEmail, jobId, resumeData);
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
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

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
    
    // Use optimized service to get tailored resume
    const result = await ResumeService.getTailoredResume(userEmail, parseInt(jobId));
    console.log('✅ Tailored resume fetched:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching tailored resume:', error);
    if (error instanceof Error && error.message === 'No tailored resume found') {
      return NextResponse.json({ error: 'No tailored resume found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch tailored resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
