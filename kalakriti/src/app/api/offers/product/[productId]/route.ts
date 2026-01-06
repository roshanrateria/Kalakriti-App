import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

// GET - Check if buyer has accepted offer for this product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== 'BUYER') {
      return NextResponse.json(
        { hasAcceptedOffer: false }
      )
    }

    const { productId } = await params

    // Find accepted offer for this buyer and product
    const acceptedOffer = await prisma.offer.findFirst({
      where: {
        productId,
        userId: user.id,
        status: 'ACCEPTED'
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        offerPrice: true,
        originalPrice: true,
        quantity: true,
        expiresAt: true,
        updatedAt: true
      }
    })

    if (!acceptedOffer) {
      return NextResponse.json({
        hasAcceptedOffer: false
      })
    }    // Check if offer has a validity period (e.g., 24 hours from acceptance)
    const offerValidUntil = new Date(acceptedOffer.updatedAt)
    offerValidUntil.setHours(offerValidUntil.getHours() + 24) // Valid for 24 hours

    const isValid = new Date() < offerValidUntil

    // If offer has expired, update its status in the database
    if (!isValid) {
      await prisma.offer.update({
        where: { id: acceptedOffer.id },
        data: { status: 'EXPIRED' }
      })
    }

    return NextResponse.json({
      hasAcceptedOffer: true,
      offer: isValid ? {
        id: acceptedOffer.id,
        offerPrice: acceptedOffer.offerPrice,
        originalPrice: acceptedOffer.originalPrice,
        quantity: acceptedOffer.quantity,
        validUntil: offerValidUntil.toISOString(),
        discountPercent: Math.round(((acceptedOffer.originalPrice - acceptedOffer.offerPrice) / acceptedOffer.originalPrice) * 100)
      } : null,
      isExpired: !isValid
    })
  } catch (error) {
    console.error('Error checking accepted offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
