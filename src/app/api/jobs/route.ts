// openresume/src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '../../../lib/services/jobService';
import { testConnection } from '../../../lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Get user email from query parameters
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    console.log('🔍 OpenResume API - userEmail:', userEmail);
    
    if (!userEmail) {
      console.log('❌ No userEmail provided');
      return NextResponse.json({ error: 'userEmail parameter is required' }, { status: 400 });
    }

    // Use optimized service to get jobs (fixes N+1 query problem)
    const jobs = await JobService.getJobsForUser(userEmail);
    console.log(`✅ Received ${jobs.length} jobs from optimized service`);
    
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('❌ Error in OpenResume API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const body = await request.json();
    const { userEmail, ...jobData } = body;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    // Use optimized service to create job
    const job = await JobService.createJob(userEmail, jobData);
    console.log(`✅ Created job ${job.id} for user ${userEmail}`);
    
    return NextResponse.json({
      success: true,
      job: job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}