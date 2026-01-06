// AI Agent for intelligent tool selection and execution
import { generateText } from '@/lib/gemini'
import { agentTools, AgentTool, ToolResult } from './ai-tools'

export interface AgentContext {
  userId?: string
  userRole?: string
  conversationHistory?: any[]
  language?: string
}

export interface AgentResponse {
  response: string
  toolsUsed: string[]
  data?: any
  productRecommendations?: any[]
}

export class AIAgent {
  private tools: AgentTool[]

  constructor() {
    this.tools = agentTools
  }

  async processQuery(userMessage: string, context: AgentContext = {}): Promise<AgentResponse> {
    try {
      // Step 1: Analyze the query and determine which tools to use
      const toolSelection = await this.selectTools(userMessage, context)
      
      let toolResults: { [toolName: string]: ToolResult } = {}
      let productRecommendations: any[] = []

      // Step 2: Execute selected tools
      for (const { toolName, parameters } of toolSelection.tools) {
        const tool = this.tools.find(t => t.name === toolName)
        if (tool) {
          console.log(`Executing tool: ${toolName} with params:`, parameters)
          const result = await tool.execute(parameters, context)
          toolResults[toolName] = result
          
          // Collect product recommendations
          if (result.success && result.data) {
            if (Array.isArray(result.data)) {
              productRecommendations.push(...result.data)
            } else if (result.data.products) {
              productRecommendations.push(...result.data.products)
            }
          }
        }
      }

      // Step 3: Generate natural language response
      const response = await this.generateResponse(
        userMessage,
        toolSelection.reasoning,
        toolResults,
        context
      )

      return {
        response,
        toolsUsed: toolSelection.tools.map(t => t.toolName),
        data: toolResults,
        productRecommendations: productRecommendations.slice(0, 6) // Limit recommendations
      }
    } catch (error) {
      console.error('Agent processing error:', error)
      return {
        response: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
        toolsUsed: [],
        data: {},
        productRecommendations: []
      }
    }
  }

  private async selectTools(userMessage: string, context: AgentContext): Promise<{
    tools: Array<{ toolName: string; parameters: any }>,
    reasoning: string
  }> {
    const toolDescriptions = this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }))

    const prompt = `
You are an AI assistant for Kalakriti, an Indian handicraft marketplace. Analyze the user's query and determine which tools to use.

Available Tools:
${JSON.stringify(toolDescriptions, null, 2)}

User Message: "${userMessage}"

Context:
- User ID: ${context.userId || 'Guest'}
- Previous conversation: ${context.conversationHistory?.slice(-2).map(msg => `${msg.sender}: ${msg.text}`).join('\n') || 'None'}

Instructions:
1. Analyze the user's intent and requirements
2. Select the most appropriate tools to fulfill the request
3. Extract parameters from the user message for each tool
4. Return a JSON response with your reasoning and tool selections

Important Guidelines:
- For price-related queries (e.g., "under 1000", "within budget"), use search_products with price filters
- For gift recommendations, use recommend_gifts with recipient details
- For cultural questions, use get_cultural_context
- For general product searches, use search_products
- For personalized suggestions, use get_personalized_recommendations
- Extract specific numbers, names, and criteria from the user message

Examples:
"Find me paintings under 1000" → search_products with query="paintings", maxPrice=1000
"Which gifts for colleague" → recommend_gifts with recipient="colleague"
"What is Madhubani art" → get_cultural_context with artForm="madhubani"

Response Format:
{
  "reasoning": "Explanation of why these tools were selected",
  "tools": [
    {
      "toolName": "tool_name",
      "parameters": { "param1": "value1", "param2": "value2" }
    }
  ]
}
`

    try {
      const aiResponse = await generateText(prompt)
      console.log('Tool selection AI response:', aiResponse)
      
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const selection = JSON.parse(jsonMatch[0])
        return {
          tools: selection.tools || [],
          reasoning: selection.reasoning || 'Tools selected based on query analysis'
        }
      }
    } catch (error) {
      console.error('Tool selection error:', error)
    }

    // Fallback: Simple intent detection
    return this.fallbackToolSelection(userMessage)
  }

  private fallbackToolSelection(userMessage: string): {
    tools: Array<{ toolName: string; parameters: any }>,
    reasoning: string
  } {
    const message = userMessage.toLowerCase()
    
    // Extract price from message
    const priceMatch = message.match(/under (\d+)|below (\d+)|within (\d+)|budget (\d+)/)
    const maxPrice = priceMatch ? parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3] || priceMatch[4]) : undefined

    // Gift-related keywords
    if (message.includes('gift') || message.includes('present') || 
        message.includes('colleague') || message.includes('friend') || 
        message.includes('family') || message.includes('mother') || 
        message.includes('father')) {
      
      let recipient = 'friend' // default
      if (message.includes('colleague')) recipient = 'colleague'
      else if (message.includes('family')) recipient = 'family'
      else if (message.includes('mother')) recipient = 'mother'
      else if (message.includes('father')) recipient = 'father'

      return {
        tools: [{
          toolName: 'recommend_gifts',
          parameters: { recipient, budget: maxPrice }
        }],
        reasoning: 'Detected gift recommendation request'
      }
    }

    // Cultural context queries
    if (message.includes('what is') || message.includes('tell me about') || 
        message.includes('cultural') || message.includes('traditional')) {
      
      const culturalTerms = ['madhubani', 'warli', 'kalamkari', 'pottery', 'silk', 'wood carving']
      const foundTerm = culturalTerms.find(term => message.includes(term))
      
      return {
        tools: [{
          toolName: 'get_cultural_context',
          parameters: foundTerm ? { artForm: foundTerm } : { artForm: message.split(' ').pop() }
        }],
        reasoning: 'Detected cultural context inquiry'
      }
    }

    // Product search (default)
    return {
      tools: [{
        toolName: 'search_products',
        parameters: {
          query: userMessage,
          maxPrice,
          limit: 8
        }
      }],
      reasoning: 'General product search request'
    }
  }

  private async generateResponse(
    userMessage: string,
    reasoning: string,
    toolResults: { [toolName: string]: ToolResult },
    context: AgentContext
  ): Promise<string> {
    // Prepare tool results summary
    const resultsContext = Object.entries(toolResults)
      .map(([toolName, result]) => {
        if (!result.success) return `${toolName}: Failed - ${result.error}`
        
        if (result.data) {
          if (Array.isArray(result.data)) {
            return `${toolName}: Found ${result.data.length} results`
          } else if (result.data.products) {
            const products = result.data.products
            return `${toolName}: Found ${products.length} products - ${products.slice(0, 3).map((p: any) => `${p.title} (₹${p.price})`).join(', ')}`
          } else if (result.data.analysis) {
            const analysis = result.data.analysis
            return `${toolName}: Price range ₹${analysis.minPrice}-₹${analysis.maxPrice}, Average: ₹${analysis.avgPrice}`
          } else if (result.data.culturalInfo) {
            return `${toolName}: Cultural information provided`
          }
        }
        
        return `${toolName}: ${result.message || 'Completed successfully'}`
      })
      .join('\n')

    const prompt = `
You are Kala, the AI assistant for Kalakriti marketplace. Generate a helpful, natural response to the user's query.

User Query: "${userMessage}"
Tool Selection Reasoning: ${reasoning}

Tool Results:
${resultsContext}

Guidelines:
1. Be conversational and helpful
2. Mention specific products if found (name and price)
3. Provide cultural context when relevant
4. Use Indian Rupees (₹) for prices
5. If products were found, mention how many and highlight 2-3 examples
6. If it's a gift recommendation, explain why these are suitable
7. If price analysis was done, summarize key insights
8. Keep response informative but under 200 words
9. End with a question or offer to help further

Example response style:
"I found 8 beautiful paintings under ₹1000 for you! Here are some great options:

• **Traditional Madhubani Painting** - ₹750 (Hand-painted with natural colors)
• **Warli Art Canvas** - ₹900 (Authentic tribal art from Maharashtra)  
• **Folk Art Print** - ₹650 (Perfect for home decoration)

These paintings represent rich Indian cultural heritage and are perfect for adding traditional charm to your space. The Madhubani style originated in Bihar and features intricate patterns with cultural significance.

Would you like to see more details about any of these, or shall I help you find paintings in a specific style?"
`

    try {
      const response = await generateText(prompt)
      return response
    } catch (error) {
      console.error('Response generation error:', error)
      
      // Fallback response based on available data
      const totalProducts = Object.values(toolResults)
        .reduce((total, result) => {
          if (result.success && result.data) {
            if (Array.isArray(result.data)) return total + result.data.length
            if (result.data.products) return total + result.data.products.length
          }
          return total
        }, 0)

      if (totalProducts > 0) {
        return `I found ${totalProducts} products that match your request. These items represent quality Indian craftsmanship and are available for immediate purchase. Would you like more details about any specific product?`
      } else {
        return "I understand you're looking for products, but I couldn't find exact matches. Could you provide more details about what you're specifically looking for? I can help you search by material, art form, price range, or occasion."
      }
    }
  }
}

export const aiAgent = new AIAgent()
