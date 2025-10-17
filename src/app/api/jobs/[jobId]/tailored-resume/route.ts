// openresume/src/app/api/jobs/[jobId]/tailored-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ResumeService } from '../../../../../lib/services/resumeService';
import { testConnection } from '../../../../../lib/database/connection';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const jobId = parseInt(params.jobId);
    const body = await request.json();
    const { userEmail } = body;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }
    
    // Use optimized service to create tailored resume
    const result = await ResumeService.createTailoredResumeFromMaster(userEmail, jobId);
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
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const jobId = parseInt(params.jobId);
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail parameter is required' }, { status: 400 });
    }
    
    // Use optimized service to get tailored resume
    const result = await ResumeService.getTailoredResume(userEmail, jobId);
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