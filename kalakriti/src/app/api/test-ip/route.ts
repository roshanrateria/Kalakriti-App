// API endpoint to verify the outbound IP address of Cloud Run
// This helps verify that Cloud NAT is working correctly

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch our public IP from an external service
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      outboundIP: data.ip,
      expectedIP: '34.67.144.22',
      isUsingStaticIP: data.ip === '34.67.144.22',
      message: data.ip === '34.67.144.22' 
        ? '✅ Cloud NAT is working! Using static IP.' 
        : '⚠️ Not using static IP yet. Cloud NAT may need time to propagate or may not be configured.',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching IP:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch IP address',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
