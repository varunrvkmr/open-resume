// openresume/src/app/api/master-resume/route.ts
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
    const { userEmail, resumeData } = body;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }
    
    if (!resumeData) {
      return NextResponse.json({ error: 'resumeData is required' }, { status: 400 });
    }
    
    console.log('💾 Saving master resume for user:', userEmail);
    
    // Use optimized service to save master resume
    const result = await ResumeService.saveMasterResume(userEmail, resumeData);
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
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail parameter is required' }, { status: 400 });
    }
    
    console.log('📖 Fetching master resume for user:', userEmail);
    
    // Use optimized service to get master resume
    const result = await ResumeService.getMasterResume(userEmail);
    console.log('✅ Master resume fetched:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching master resume:', error);
    if (error instanceof Error && error.message === 'No master resume found') {
      return NextResponse.json({ error: 'No master resume found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch master resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
