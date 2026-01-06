// API endpoint for AI-powered image editing using Gemini 3 Pro Image Preview
// This endpoint is SECURE - API key is never exposed to the client

import { NextRequest, NextResponse } from 'next/server'

interface EditImageRequest {
  imageData: string // base64 encoded image
  editType: 'enhance' | 'change-background'
  productDetails: {
    title: string
    description: string
    price: number
    material?: string
    technique?: string
    artForm?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: EditImageRequest = await request.json()
    const { imageData, editType, productDetails } = body

    if (!imageData || !editType || !productDetails) {
      return NextResponse.json(
        { error: 'Missing required fields: imageData, editType, and productDetails' },
        { status: 400 }
      )
    }

    // Get API key from environment - NEVER exposed to client
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      console.error('GOOGLE_AI_API_KEY not configured')
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    // Dynamically import the Google Gen AI SDK
    const { GoogleGenAI } = await import('@google/genai')
    
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    })

    // Create carefully crafted prompts based on edit type
    const prompts = {
      'change-background': `You are an expert product photographer for an e-commerce platform specializing in handcrafted artisan products.

PRODUCT DETAILS:
- Name: ${productDetails.title}
- Description: ${productDetails.description}
- Price: ₹${productDetails.price}
${productDetails.material ? `- Material: ${productDetails.material}` : ''}
${productDetails.technique ? `- Crafting Technique: ${productDetails.technique}` : ''}
${productDetails.artForm ? `- Traditional Art Form: ${productDetails.artForm}` : ''}

TASK: Change the background of this ${productDetails.title} image to a professional e-commerce style.

STRICT REQUIREMENTS:
1. KEEP THE PRODUCT (${productDetails.title}) EXACTLY AS IS - do not modify the product itself in any way
2. Remove the current background completely
3. Replace with one of these professional backgrounds:
   - Pure white studio background (recommended for most products)
   - Subtle gradient background (white to light gray)
   - Contextual background that enhances the product's cultural significance (e.g., traditional textile for fabric products, rustic wood for wooden crafts)
4. Ensure perfect edge detection - product edges must be clean and natural
5. Maintain proper shadows and lighting for realistic product placement
6. The ${productDetails.title} must look naturally placed on the new background

The product must look naturally placed on the new background, not cut-and-pasted.`,

      'enhance': `You are an expert product photographer for an e-commerce platform specializing in handcrafted artisan products.

PRODUCT DETAILS:
- Name: ${productDetails.title}
- Description: ${productDetails.description}
- Price: ₹${productDetails.price}
${productDetails.material ? `- Material: ${productDetails.material}` : ''}
${productDetails.technique ? `- Crafting Technique: ${productDetails.technique}` : ''}
${productDetails.artForm ? `- Traditional Art Form: ${productDetails.artForm}` : ''}

TASK: Enhance this ${productDetails.title} image for professional e-commerce display.

STRICT REQUIREMENTS:
1. KEEP THE PRODUCT (${productDetails.title}) EXACTLY AS IS - preserve all original details, colors, patterns, and textures
2. You MAY enhance:
   - Image sharpness and clarity
   - Color vibrancy (subtle, maintain authenticity)
   - Lighting to eliminate shadows and dark spots
   - Professional studio-quality appearance
3. DO NOT change:
   - Product dimensions or proportions
   - Product colors (enhance, don't change)
   - Craftsmanship details
   - Cultural or artistic elements
4. Optimize image for e-commerce: clean, clear, professional
5. Focus on making this ${productDetails.title} look its absolute best

Goal: Make the existing ${productDetails.title} photo look more professional and appealing while maintaining 100% authenticity.`
    }

    const selectedPrompt = prompts[editType]

    // Extract base64 data and mime type properly
    let base64Data: string
    let mimeType: string

    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      // Handle URL - fetch and convert to base64
      console.log('Fetching image from URL:', imageData)
      try {
        const imageResponse = await fetch(imageData)
        if (!imageResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch image from URL' },
            { status: 400 }
          )
        }
        
        const arrayBuffer = await imageResponse.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        base64Data = buffer.toString('base64')
        
        // Detect mime type from response or URL
        mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'
        if (!mimeType.startsWith('image/')) {
          mimeType = 'image/jpeg'
        }
        
        console.log('Image fetched and converted to base64, mime type:', mimeType)
      } catch (error) {
        console.error('Error fetching image:', error)
        return NextResponse.json(
          { error: 'Failed to fetch image from URL' },
          { status: 400 }
        )
      }
    } else if (imageData.startsWith('data:')) {
      // Handle data URL format (data:image/jpeg;base64,...)
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/)
      if (!matches) {
        return NextResponse.json(
          { error: 'Invalid image data format' },
          { status: 400 }
        )
      }
      mimeType = matches[1]
      base64Data = matches[2]
    } else {
      // Already base64 encoded
      base64Data = imageData
      mimeType = 'image/jpeg' // default
    }

    // Validate mime type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported image format: ${mimeType}. Please use JPEG, PNG, or WebP.` },
        { status: 400 }
      )
    }

    // Use the EXACT format from the working test file
    const prompt = [
      { 
        text: selectedPrompt
      },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
    ]
      console.log('Sending request to Gemini API with model: gemini-3-pro-image-preview')
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: prompt,
    })

    console.log('Response received!')
    
    let editedImageData: string | null = null
    let textResponse = ''    // Process response exactly like the working test
    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          textResponse += part.text
          console.log('Text response:', part.text)
        } else if (part.inlineData) {
          const responseImageData = part.inlineData.data
          const responseMimeType = part.inlineData.mimeType || 'image/jpeg'
          editedImageData = `data:${responseMimeType};base64,${responseImageData}`
          console.log('Image data received!')
        }
      }
    }

    if (!editedImageData) {
      console.error('No image in response')
      return NextResponse.json(
        { 
          error: 'Failed to generate edited image', 
          details: textResponse || 'No image was generated'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      editedImage: editedImageData,
      editType: editType,
      notes: textResponse || 'Image edited successfully'
    })

  } catch (error: any) {
    console.error('Error generating content:', error.message)
    if (error.response) {
      console.error('Response error:', error.response)
    }
    return NextResponse.json(
      { 
        error: 'Failed to edit image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'AI Image Editor',
    model: 'gemini-3-pro-image-preview',
    securityNote: 'API key is server-side only'
  })
}
