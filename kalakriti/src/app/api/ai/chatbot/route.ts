import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'
import { BhashiniService } from '@/lib/bhashini'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { aiAgent, AgentContext } from '@/lib/ai-agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, language = 'en', context } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get user info if authenticated
    let user = null
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (token) {
      try {
        user = await getUserFromToken(token)
      } catch (error) {
        // Continue without user info if token is invalid
      }
    }

    // Translate message to English for processing if needed
    const messageForProcessing = language === 'en' ? message : await BhashiniService.translateText(message, language, 'en')

    // Prepare agent context
    const agentContext: AgentContext = {
      userId: user?.id,
      userRole: user?.role,
      conversationHistory: context?.conversationHistory || [],
      language
    }

    // Process query using AI Agent
    console.log('Processing query with AI Agent:', messageForProcessing)
    const agentResponse = await aiAgent.processQuery(messageForProcessing, agentContext)
    
    // Translate response back to user's language if needed
    const finalResponse = language === 'en' ? agentResponse.response : await BhashiniService.translateText(agentResponse.response, 'en', language)

    console.log('Agent response:', {
      toolsUsed: agentResponse.toolsUsed,
      productCount: agentResponse.productRecommendations?.length || 0
    })

    return NextResponse.json({ 
      response: finalResponse,
      productRecommendations: agentResponse.productRecommendations || [],
      toolsUsed: agentResponse.toolsUsed || [],
      agentData: agentResponse.data
    })  } catch (error) {
    console.error('Error in chatbot:', error)
    
    // Fallback to simple response
    return NextResponse.json({ 
      response: "I'm here to help you with Kalakriti! You can search for products, get recommendations, or ask me about our marketplace. How can I assist you today?",
      productRecommendations: [],
      toolsUsed: ['fallback'],
      agentData: {}
    })
  }
}

// Fallback function for when AI agent fails
async function handleFallbackQuery(message: string) {
  const searchTerms = message.toLowerCase()
  
  // Simple product search as fallback
  try {
    const products = await prisma.product.findMany({
      where: {
        inStock: true,
        OR: [
          { title: { contains: searchTerms } },
          { description: { contains: searchTerms } },
          { tags: { contains: searchTerms } }
        ]
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    let response = "I'm here to help you find products on Kalakriti! "
    
    if (products.length > 0) {
      response += `I found ${products.length} products that might interest you. `
      response += products.slice(0, 2).map(p => `${p.title} for ₹${p.price.toLocaleString()}`).join(', ')
      response += ". Would you like to see more details?"
    } else {
      response += "I couldn't find specific products for that search, but I can help you explore our categories like electronics, handicrafts, clothing, and more. What type of products are you looking for?"
    }

    return {
      response,
      products
    }
  } catch (error) {
    return {
      response: "I'm here to help you with Kalakriti! You can search for products, get recommendations, or ask me about our marketplace. How can I assist you today?",
      products: []
    }
  }
}


