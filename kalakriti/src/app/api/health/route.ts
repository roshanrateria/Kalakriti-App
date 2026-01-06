import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Basic health check without database dependency for container startup
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'kalakriti-api',
      environment: process.env.NODE_ENV || 'unknown',
      version: '1.0.0'
    }

    // Optional database check (non-blocking)
    try {
      await prisma.$queryRaw`SELECT 1`
      healthStatus.database = 'connected'
    } catch (dbError) {
      console.warn('Database not ready:', dbError)
      healthStatus.database = 'not_ready'
    }
    
    return NextResponse.json(healthStatus, { status: 200 })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
