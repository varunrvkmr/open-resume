import { NextResponse } from 'next/server';
import { testConnection } from '../../../lib/database/connection';

export async function GET() {
  try {
    // Test database connection
    const isDbConnected = await testConnection();
    
    return NextResponse.json({ 
      status: isDbConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'openresume',
      version: process.env.npm_package_version || '1.0.0',
      database: isDbConnected ? 'connected' : 'disconnected',
      features: {
        optimized_queries: true,
        n1_query_fix: true,
        dedicated_backend: true
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        database: 'error'
      },
      { status: 500 }
    );
  }
}
