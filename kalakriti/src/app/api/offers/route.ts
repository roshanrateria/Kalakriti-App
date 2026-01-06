import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

// GET - Get offers for a user (buyers get their made offers, sellers get received offers)
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all' // 'made', 'received', 'all'
    const status = searchParams.get('status') // 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'

    let whereClause: any = {}

    if (user.role === 'BUYER') {
      if (type === 'made' || type === 'all') {
        whereClause.userId = user.id
      }
      if (type === 'received') {
        // Buyers don't receive offers, return empty
        return NextResponse.json({ offers: [] })
      }
    } else if (user.role === 'SELLER') {
      if (type === 'received' || type === 'all') {
        whereClause.sellerId = user.id
      }
      if (type === 'made') {
        // Sellers don't make offers, return empty
        return NextResponse.json({ offers: [] })
      }
    }

    if (status) {
      whereClause.status = status
    }

    const offers = await prisma.offer.findMany({
      where: whereClause,
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
      },
      orderBy: { createdAt: 'desc' }
    })

    // Parse JSON fields in product data
    const parsedOffers = offers.map(offer => ({
      ...offer,
      product: {
        ...offer.product,
        images: typeof offer.product.images === 'string' 
          ? JSON.parse(offer.product.images) 
          : offer.product.images
      }
    }))

    return NextResponse.json({ offers: parsedOffers })
  } catch (error) {
    console.error('Error fetching offers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new offer
export async function POST(request: NextRequest) {
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
        { error: 'Buyer access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { productId, offerPrice, message, quantity = 1 } = body

    if (!productId || !offerPrice || offerPrice <= 0) {
      return NextResponse.json(
        { error: 'Product ID and valid offer price are required' },
        { status: 400 }
      )
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        price: true,
        inStock: true,
        stockQuantity: true,
        sellerId: true,
        seller: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (!product.inStock) {
      return NextResponse.json(
        { error: 'Product is out of stock' },
        { status: 400 }
      )
    }

    if (product.sellerId === user.id) {
      return NextResponse.json(
        { error: 'You cannot make an offer on your own product' },
        { status: 400 }
      )
    }

    // Check if offer price is within acceptable range (e.g., not too low)
    const minOfferPrice = product.price * 0.5 // Minimum 50% of original price
    if (offerPrice < minOfferPrice) {
      return NextResponse.json(
        { error: `Offer price must be at least ₹${minOfferPrice.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Check if user has pending offer for this product
    const existingOffer = await prisma.offer.findFirst({
      where: {
        productId,
        userId: user.id,
        status: 'PENDING'
      }
    })

    if (existingOffer) {
      return NextResponse.json(
        { error: 'You already have a pending offer for this product' },
        { status: 400 }
      )
    }

    // Create the offer with expiration (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const offer = await prisma.offer.create({
      data: {
        productId,
        userId: user.id,
        sellerId: product.sellerId,
        offerPrice,
        originalPrice: product.price,
        message: message || null,
        quantity,
        expiresAt,
        status: 'PENDING'
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
        seller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

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

    return NextResponse.json({ 
      offer: parsedOffer, 
      message: 'Offer submitted successfully! The seller will be notified.' 
    })
  } catch (error) {
    console.error('Error creating offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
