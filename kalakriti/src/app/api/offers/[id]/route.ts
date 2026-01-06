import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

// GET - Get specific offer details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { id: offerId } = await params

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            inStock: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this offer
    if (offer.userId !== user.id && offer.sellerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Parse JSON fields
    const parsedOffer = {
      ...offer,
      product: {
        ...offer.product,
        images: typeof offer.product.images === 'string' 
          ? JSON.parse(offer.product.images) 
          : offer.product.images
      }
    }

    return NextResponse.json({ offer: parsedOffer })
  } catch (error) {
    console.error('Error fetching offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update offer status (accept/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { id: offerId } = await params
    const body = await request.json()
    const { status, counterOffer } = body

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACCEPTED or REJECTED' },
        { status: 400 }
      )
    }

    // Get the offer with product details
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            inStock: true,
            stockQuantity: true
          }
        }
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    // Only sellers can accept/reject offers
    if (user.role !== 'SELLER' || offer.sellerId !== user.id) {
      return NextResponse.json(
        { error: 'Only the seller can accept or reject offers' },
        { status: 403 }
      )
    }

    // Check if offer is still pending
    if (offer.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Offer is already ${offer.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Check if offer has expired
    if (offer.expiresAt && new Date() > offer.expiresAt) {
      await prisma.offer.update({
        where: { id: offerId },
        data: { status: 'EXPIRED' }
      })
      return NextResponse.json(
        { error: 'Offer has expired' },
        { status: 400 }
      )
    }

    // Check if product is still available
    if (!offer.product.inStock) {
      return NextResponse.json(
        { error: 'Product is no longer available' },
        { status: 400 }
      )
    }

    // Update the offer
    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // If accepted, we could automatically create an order or add to cart
    // For now, we'll just return success message
    const message = status === 'ACCEPTED' 
      ? 'Offer accepted! The buyer will be notified and can proceed with purchase.'
      : 'Offer rejected. The buyer has been notified.'

    // Parse JSON fields
    const parsedOffer = {
      ...updatedOffer,
      product: {
        ...updatedOffer.product,
        images: typeof updatedOffer.product.images === 'string' 
          ? JSON.parse(updatedOffer.product.images) 
          : updatedOffer.product.images
      }
    }

    return NextResponse.json({ 
      offer: parsedOffer, 
      message 
    })
  } catch (error) {
    console.error('Error updating offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel an offer (only by the buyer who made it)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { id: offerId } = await params

    const offer = await prisma.offer.findUnique({
      where: { id: offerId }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    // Only the buyer who made the offer can cancel it
    if (user.role !== 'BUYER' || offer.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only cancel your own offers' },
        { status: 403 }
      )
    }

    // Can only cancel pending offers
    if (offer.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot cancel ${offer.status.toLowerCase()} offer` },
        { status: 400 }
      )
    }

    await prisma.offer.delete({
      where: { id: offerId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Offer cancelled successfully' 
    })
  } catch (error) {
    console.error('Error cancelling offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
