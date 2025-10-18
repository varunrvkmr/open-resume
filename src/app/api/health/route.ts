import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test backend connection
    const backendUrl = process.env.BACKEND_URL || 'http://backend:5050';
    let backendStatus = 'unknown';
    
    try {
      const response = await fetch(`${backendUrl}/api/openresume/debug`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      backendStatus = response.ok ? 'connected' : 'error';
    } catch (error) {
      backendStatus = 'disconnected';
    }
    
    return NextResponse.json({ 
      status: backendStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'openresume',
      version: process.env.npm_package_version || '1.0.0',
      backend: backendStatus,
      features: {
        proxy_to_backend: true,
        no_direct_db: true,
        clean_separation: true
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        backend: 'error'
      },
      { status: 500 }
    );
  }
}
