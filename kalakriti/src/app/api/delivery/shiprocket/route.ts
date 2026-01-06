import { NextRequest, NextResponse } from 'next/server'
import { calculateDeliveryCharge, checkServiceability, extractPincode, isValidPincode } from '@/lib/shiprocket'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      pickupPincode, 
      deliveryPincode, 
      weight = 0.5, 
      cod = 0,
      pickupAddress,
      deliveryAddress 
    } = body

    // Try to extract pincodes from addresses if not provided
    let pickup = pickupPincode
    let delivery = deliveryPincode

    if (!pickup && pickupAddress) {
      pickup = extractPincode(pickupAddress)
    }

    if (!delivery && deliveryAddress) {
      delivery = extractPincode(deliveryAddress)
    }

    // Validate pincodes
    if (!pickup || !isValidPincode(pickup)) {
      return NextResponse.json(
        { error: 'Valid pickup pincode is required (6 digits)' },
        { status: 400 }
      )
    }

    if (!delivery || !isValidPincode(delivery)) {
      return NextResponse.json(
        { error: 'Valid delivery pincode is required (6 digits)' },
        { status: 400 }
      )
    }

    // Calculate delivery charges using ShipRocket
    const deliveryInfo = await calculateDeliveryCharge(
      pickup,
      delivery,
      parseFloat(weight.toString()),
      parseFloat(cod.toString())
    )

    return NextResponse.json({
      success: true,
      ...deliveryInfo,
      pincodes: {
        pickup,
        delivery
      }
    })
  } catch (error) {
    console.error('Error calculating ShipRocket delivery:', error)
    return NextResponse.json(
      { 
        error: 'Failed to calculate delivery charge',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pickupPincode = searchParams.get('pickupPincode')
    const deliveryPincode = searchParams.get('deliveryPincode')
    const weight = searchParams.get('weight') || '0.5'
    const cod = searchParams.get('cod') || '0'

    if (!pickupPincode || !isValidPincode(pickupPincode)) {
      return NextResponse.json(
        { error: 'Valid pickup pincode is required (6 digits)' },
        { status: 400 }
      )
    }

    if (!deliveryPincode || !isValidPincode(deliveryPincode)) {
      return NextResponse.json(
        { error: 'Valid delivery pincode is required (6 digits)' },
        { status: 400 }
      )
    }

    const deliveryInfo = await checkServiceability(
      pickupPincode,
      deliveryPincode,
      parseFloat(weight),
      parseFloat(cod)
    )

    return NextResponse.json({
      success: true,
      ...deliveryInfo
    })
  } catch (error) {
    console.error('Error checking ShipRocket serviceability:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check serviceability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
