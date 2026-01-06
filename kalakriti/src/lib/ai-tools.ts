// AI Tools for Agentic Chatbot
import { prisma } from '@/lib/prisma'
import { generateText } from '@/lib/gemini'

export interface ToolResult {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export interface AgentTool {
  name: string
  description: string
  parameters: any
  execute: (params: any, context?: any) => Promise<ToolResult>
}

// Tool 1: Advanced Product Search
export const productSearchTool: AgentTool = {
  name: 'search_products',
  description: 'Search for products with advanced filters including price range, material, art form, origin, and other criteria',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query text' },
      minPrice: { type: 'number', description: 'Minimum price filter' },
      maxPrice: { type: 'number', description: 'Maximum price filter' },
      material: { type: 'string', description: 'Product material (wood, clay, silk, etc.)' },
      artForm: { type: 'string', description: 'Traditional art form (madhubani, warli, etc.)' },
      origin: { type: 'string', description: 'Place of origin' },
      isCustomizable: { type: 'boolean', description: 'Whether product can be customized' },
      inStock: { type: 'boolean', description: 'Filter for in-stock products only', default: true },
      sortBy: { type: 'string', enum: ['price_asc', 'price_desc', 'newest', 'oldest', 'popular'], description: 'Sort criteria' },
      limit: { type: 'number', description: 'Maximum number of results', default: 10 }
    }
  },
  execute: async (params) => {
    try {
      const {
        query,
        minPrice,
        maxPrice,
        material,
        artForm,
        origin,
        isCustomizable,
        inStock = true,
        sortBy = 'newest',
        limit = 10
      } = params

      // Build search conditions
      const where: any = {}
      
      if (inStock) {
        where.inStock = true
        where.stockQuantity = { gt: 0 }
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {}
        if (minPrice !== undefined) where.price.gte = minPrice
        if (maxPrice !== undefined) where.price.lte = maxPrice
      }

      // Text search across multiple fields
      if (query) {
        const searchTerms = query.toLowerCase().split(' ')
        const searchConditions: any[] = []
        
        for (const term of searchTerms) {        searchConditions.push(
          { title: { contains: term } },
          { description: { contains: term } },
          { tags: { contains: term } },
          { material: { contains: term } },
          { artForm: { contains: term } },
          { technique: { contains: term } }
        )
        }
        
        if (searchConditions.length > 0) {
          where.OR = searchConditions
        }
      }

      // Specific filters    
  if (material) {
    where.material = { contains: material }
      }
      if (artForm) {
        where.artForm = { contains: artForm }
      }
      if (origin) {
        where.origin = { contains: origin }
      }
      if (isCustomizable !== undefined) {
        where.isCustomizable = isCustomizable
      }

      // Sort options
      const orderBy: any = {}
      switch (sortBy) {
        case 'price_asc':
          orderBy.price = 'asc'
          break
        case 'price_desc':
          orderBy.price = 'desc'
          break
        case 'oldest':
          orderBy.createdAt = 'asc'
          break
        case 'popular':
          orderBy.isFeatured = 'desc'
          break
        default:
          orderBy.createdAt = 'desc'
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        },
        orderBy,
        take: Math.min(limit, 20) // Cap at 20 for performance
      })

      return {
        success: true,
        data: products,
        message: `Found ${products.length} products matching your criteria`
      }
    } catch (error) {
      console.error('Product search error:', error)
      return {
        success: false,
        error: 'Failed to search products'
      }
    }
  }
}

// Tool 2: Intelligent Gift Recommendations
export const giftRecommendationTool: AgentTool = {
  name: 'recommend_gifts',
  description: 'Recommend gifts based on recipient type, occasion, budget, and preferences',  parameters: {
    type: 'object',
    properties: {
      recipient: { type: 'string', description: 'Type of recipient (colleague, friend, family, mother, father, etc.) or general gift type (traditional, modern, etc.)' },
      occasion: { type: 'string', description: 'Occasion (birthday, anniversary, festival, appreciation, etc.)' },
      budget: { type: 'number', description: 'Budget in INR' },
      minPrice: { type: 'number', description: 'Minimum price in INR' },
      interests: { type: 'string', description: 'Recipient interests or preferences' },
      relationship: { type: 'string', description: 'Relationship with recipient (close, professional, casual)' },
      age_group: { type: 'string', description: 'Age group (young, middle-aged, elderly)' },
      gender: { type: 'string', description: 'Gender preference if relevant' }
    },
    required: []  // Make recipient optional so it can handle general gift searches
  },
  execute: async (params) => {    try {
      const { recipient, occasion, budget, minPrice, interests, relationship, age_group, gender } = params

      // Define gift categories and preferences based on recipient and occasion
      const giftRules: Record<string, any> = {colleague: {
          artForms: ['madhubani', 'warli', 'kalamkari', 'pottery', 'silk painting'],
          materials: ['ceramic', 'wood', 'metal', 'silk', 'cotton'],
          price_range: { min: 500, max: 10000 }, // Increased max for higher budgets
          customizable: false,
          keywords: ['desk', 'office', 'decorative', 'professional', 'elegant', 'traditional']
        },
        friend: {
          artForms: ['madhubani', 'warli', 'pottery', 'jewelry'],
          materials: ['ceramic', 'cotton', 'silk', 'metal'],
          price_range: { min: 300, max: 3000 },
          customizable: true,
          keywords: ['trendy', 'colorful', 'unique', 'personal']
        },
        family: {
          artForms: ['traditional', 'religious', 'cultural'],
          materials: ['wood', 'stone', 'silk', 'cotton'],
          price_range: { min: 1000, max: 10000 },
          customizable: true,
          keywords: ['traditional', 'cultural', 'heritage', 'meaningful']
        },
        mother: {
          artForms: ['silk painting', 'jewelry', 'pottery'],
          materials: ['silk', 'cotton', 'ceramic', 'metal'],
          price_range: { min: 1000, max: 5000 },
          keywords: ['elegant', 'beautiful', 'traditional', 'saree', 'jewelry']
        },        father: {
          artForms: ['wood carving', 'metal work', 'traditional art'],
          materials: ['wood', 'metal', 'stone'],
          price_range: { min: 1000, max: 5000 },
          keywords: ['traditional', 'masculine', 'utility', 'decorative']
        },
        // Add general categories for when no specific recipient is mentioned
        traditional: {
          artForms: ['madhubani', 'warli', 'kalamkari', 'pottery', 'wood carving'],
          materials: ['wood', 'ceramic', 'silk', 'cotton', 'metal'],
          price_range: { min: 500, max: 15000 },
          customizable: true,
          keywords: ['traditional', 'handmade', 'cultural', 'heritage', 'authentic']
        },        general: {
          artForms: ['madhubani', 'warli', 'pottery', 'jewelry', 'kalamkari'],
          materials: ['ceramic', 'wood', 'metal', 'silk', 'cotton'],
          price_range: { min: 200, max: 15000 },
          customizable: true,
          keywords: ['gift', 'handicraft', 'traditional', 'beautiful', 'unique']
        }
      }

      // Determine the rules to use
      let rules = giftRules.general // Default to general
      if (recipient) {
        rules = giftRules[recipient.toLowerCase()] || 
                (recipient.toLowerCase().includes('traditional') ? giftRules.traditional : giftRules.general)
      }

      // Apply budget and minPrice if provided
      let priceRange = rules.price_range
      if (budget || minPrice) {
        priceRange = {
          min: minPrice || rules.price_range.min,
          max: budget || rules.price_range.max
        }
      }// Build search query - Start with basic filters
      const where: any = {
        inStock: true,
        stockQuantity: { gt: 0 },
        price: {
          gte: priceRange.min,
          lte: priceRange.max
        }
      }

      // For gift recommendations, we'll get ALL products within budget
      // and let AI decide which ones are most suitable
      // Only apply interest-based filtering if user specifically provided interests
      if (interests) {
        const searchConditions: any[] = []
        const interestTerms = interests.toLowerCase().split(' ')
        
        for (const term of interestTerms) {
          searchConditions.push(
            { title: { contains: term } },
            { description: { contains: term } },
            { tags: { contains: term } },
            { material: { contains: term } },
            { artForm: { contains: term } }
          )
        }
        
        if (searchConditions.length > 0) {
          where.OR = searchConditions
        }
      }      let products = await prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { price: 'asc' }, // Show more affordable options first
          { createdAt: 'desc' }
        ],
        take: 20 // Get more products for AI to choose from
      })

      // If no products found with initial filters, relax the constraints
      // This ensures customers always see products they can buy
      if (products.length === 0) {
        console.log('No products found with initial filters, relaxing constraints...')
        
        // Fallback: Get all products within price range only
        const fallbackWhere: any = {
          inStock: true,
          stockQuantity: { gt: 0 },
          price: {
            gte: priceRange.min,
            lte: priceRange.max
          }
        }

        products = await prisma.product.findMany({
          where: fallbackWhere,
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                address: true
              }
            }
          },
          orderBy: [
            { isFeatured: 'desc' },
            { price: 'asc' },
            { createdAt: 'desc' }
          ],
          take: 20
        })

        // If still no products in price range, expand the price range
        if (products.length === 0) {
          console.log('No products in price range, expanding search...')
          
          const expandedWhere: any = {
            inStock: true,
            stockQuantity: { gt: 0 }
          }

          // If budget was provided, search up to 150% of budget
          if (budget) {
            expandedWhere.price = { lte: budget * 1.5 }
          }

          products = await prisma.product.findMany({
            where: expandedWhere,
            include: {
              seller: {
                select: {
                  id: true,
                  name: true,
                  address: true
                }
              }
            },
            orderBy: [
              { isFeatured: 'desc' },
              { price: 'asc' },
              { createdAt: 'desc' }
            ],
            take: 20
          })
        }
      }

      // Let AI filter and select the most appropriate products
      const selectedProducts = await selectBestGifts(products, recipient, occasion, rules, budget)// Generate AI explanation for recommendations
      const explanation = await generateGiftExplanation(recipient, occasion, selectedProducts, budget)

      return {
        success: true,
        data: {
          products: selectedProducts,
          explanation,
          criteria: {
            recipient,
            occasion,
            budget,
            priceRange
          },
          totalFound: products.length,
          selectionReasoning: `AI selected ${selectedProducts.length} most suitable products from ${products.length} available options`
        },
        message: `Found ${selectedProducts.length} gift recommendations for ${recipient}`
      }
    } catch (error) {
      console.error('Gift recommendation error:', error)
      return {
        success: false,
        error: 'Failed to generate gift recommendations'
      }
    }
  }
}

// Tool 3: Price Range Analysis
export const priceAnalysisTool: AgentTool = {
  name: 'analyze_price_range',
  description: 'Analyze price ranges for products in a category and provide market insights',
  parameters: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'Product category or search term' },
      material: { type: 'string', description: 'Material filter' },
      artForm: { type: 'string', description: 'Art form filter' }
    },
    required: ['category']
  },
  execute: async (params) => {
    try {
      const { category, material, artForm } = params

      const where: any = {        inStock: true,
        OR: [
          { title: { contains: category } },
          { description: { contains: category } },
          { tags: { contains: category } },
          { artForm: { contains: category } }
        ]
      }

      if (material) {
        where.material = { contains: material }
      }
      if (artForm) {
        where.artForm = { contains: artForm }
      }

      const products = await prisma.product.findMany({
        where,
        select: {
          price: true,
          title: true,
          material: true,
          artForm: true
        }
      })

      if (products.length === 0) {
        return {
          success: false,
          message: 'No products found in this category'
        }
      }

      const prices = products.map(p => p.price).sort((a, b) => a - b)
      const analysis = {
        count: products.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        medianPrice: prices[Math.floor(prices.length / 2)],
        priceRanges: {
          budget: prices.filter(p => p <= 1000).length,
          midRange: prices.filter(p => p > 1000 && p <= 3000).length,
          premium: prices.filter(p => p > 3000).length
        }
      }

      return {
        success: true,
        data: {
          analysis,
          category,
          sampleProducts: products.slice(0, 5)
        },
        message: `Price analysis completed for ${category}`
      }
    } catch (error) {
      console.error('Price analysis error:', error)
      return {
        success: false,
        error: 'Failed to analyze prices'
      }
    }
  }
}

// Tool 4: Cultural Context Provider
export const culturalContextTool: AgentTool = {
  name: 'get_cultural_context',
  description: 'Provide cultural context and significance of art forms, materials, or origins',
  parameters: {
    type: 'object',
    properties: {
      artForm: { type: 'string', description: 'Art form name' },
      origin: { type: 'string', description: 'Place of origin' },
      material: { type: 'string', description: 'Traditional material' },
      technique: { type: 'string', description: 'Crafting technique' }
    }
  },
  execute: async (params) => {
    try {
      const { artForm, origin, material, technique } = params      // Query products with cultural information
      const where: any = {}
      const searchConditions: any[] = []

      if (artForm) {
        searchConditions.push({ artForm: { contains: artForm } })
      }
      if (origin) {
        searchConditions.push({ origin: { contains: origin } })
      }
      if (material) {
        searchConditions.push({ material: { contains: material } })
      }
      if (technique) {
        searchConditions.push({ technique: { contains: technique } })
      }

      if (searchConditions.length > 0) {
        where.OR = searchConditions
      }

      const products = await prisma.product.findMany({
        where,
        select: {
          artForm: true,
          origin: true,
          material: true,
          technique: true,
          culturalSignificance: true,
          artisanStory: true,
          title: true,
          id: true
        },
        take: 10
      })

      // Generate cultural context using AI
      const contextQuery = [artForm, origin, material, technique].filter(Boolean).join(', ')
      const culturalInfo = await generateCulturalContext(contextQuery, products)

      return {
        success: true,
        data: {
          culturalInfo,
          relatedProducts: products.slice(0, 3),
          searchTerms: { artForm, origin, material, technique }
        },
        message: `Cultural context provided for ${contextQuery}`
      }
    } catch (error) {
      console.error('Cultural context error:', error)
      return {
        success: false,
        error: 'Failed to get cultural context'
      }
    }
  }
}

// Tool 5: Personalized Recommendations
export const personalizedRecommendationTool: AgentTool = {
  name: 'get_personalized_recommendations',
  description: 'Get personalized product recommendations based on user history and preferences',
  parameters: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'User ID for personalization' },
      preference: { type: 'string', description: 'Specific preferences or interests' },
      budget: { type: 'number', description: 'Budget range' },
      limit: { type: 'number', description: 'Number of recommendations', default: 5 }
    }
  },
  execute: async (params, context) => {
    try {
      const { userId, preference, budget, limit = 5 } = params

      let userHistory: any = {}
      
      if (userId) {
        // Get user's purchase and wishlist history
        const [orders, wishlist, cart] = await Promise.all([
          prisma.order.findMany({
            where: { buyerId: userId },
            include: {
              orderItems: {
                include: {
                  product: {
                    select: {
                      material: true,
                      artForm: true,
                      tags: true,
                      price: true
                    }
                  }
                }
              }
            },
            take: 10
          }),
          prisma.wishlistItem.findMany({
            where: { userId },
            include: {
              product: {
                select: {
                  material: true,
                  artForm: true,
                  tags: true,
                  price: true
                }
              }
            },
            take: 10
          }),
          prisma.cartItem.findMany({
            where: { userId },
            include: {
              product: {
                select: {
                  material: true,
                  artForm: true,
                  tags: true,
                  price: true
                }
              }
            }
          })
        ])

        userHistory = {
          orders,
          wishlist,
          cart
        }
      }

      // Analyze user preferences
      const preferences = analyzeUserPreferences(userHistory)
      
      // Build recommendation query
      const where: any = {
        inStock: true,
        stockQuantity: { gt: 0 }
      }

      if (budget) {
        where.price = { lte: budget }
      }

      // Apply preference-based filtering
      const searchConditions: any[] = []
        if (preferences.favoriteArtForms.length > 0) {
        for (const artForm of preferences.favoriteArtForms) {
          searchConditions.push({ artForm: { contains: artForm } })
        }
      }
      
      if (preferences.favoriteMaterials.length > 0) {
        for (const material of preferences.favoriteMaterials) {
          searchConditions.push({ material: { contains: material } })
        }
      }  
    if (preference) {
        const prefTerms = preference.toLowerCase().split(' ')
        
        for (const term of prefTerms) {
          searchConditions.push(
            { title: { contains: term } },
            { description: { contains: term } },
            { tags: { contains: term } }
          )
        }
      }

      if (searchConditions.length > 0) {
        where.OR = searchConditions
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      })

      return {
        success: true,
        data: {
          products,
          preferences,
          personalizationLevel: userId ? 'high' : 'general'
        },
        message: `Generated ${products.length} personalized recommendations`
      }
    } catch (error) {
      console.error('Personalized recommendation error:', error)
      return {
        success: false,
        error: 'Failed to generate personalized recommendations'
      }
    }
  }
}

// Helper Functions
async function selectBestGifts(products: any[], recipient: string, occasion: string, rules: any, budget?: number) {
  if (products.length <= 8) {
    return products // If we have 8 or fewer, return all
  }

  const prompt = `
You are an expert gift curator for Indian handicrafts. Select the 8 best gift options for a ${recipient}${occasion ? ` for ${occasion}` : ''}.

Available Products:
${products.map((p, i) => `${i + 1}. ${p.title} - ₹${p.price} (${p.material || 'Material not specified'}) - ${p.artForm || 'Art form not specified'}`).join('\n')}

Selection Criteria for ${recipient}:
- Price range: ₹${rules.price_range.min} - ₹${budget || rules.price_range.max}
- Preferred materials: ${rules.materials.join(', ')}
- Preferred art forms: ${rules.artForms.join(', ')}
- Context keywords: ${rules.keywords.join(', ')}

Instructions:
1. Select 8 products that are most suitable for ${recipient}
2. Consider cultural appropriateness, price value, and aesthetic appeal
3. Prefer traditional Indian craftsmanship
4. Balance between different price points within budget
5. Include variety in materials and art forms

Return only the product numbers (1-${products.length}) separated by commas, like: 1,3,5,7,9,12,15,18
`

  try {
    const response = await generateText(prompt)
    const selectedIndices = response.match(/\d+/g)?.map(n => parseInt(n) - 1).filter(i => i >= 0 && i < products.length) || []
    
    if (selectedIndices.length > 0) {
      return selectedIndices.slice(0, 8).map(i => products[i])
    }
  } catch (error) {
    console.error('AI selection error:', error)
  }

  // Fallback: return first 8 products
  return products.slice(0, 8)
}

async function generateGiftExplanation(recipient: string, occasion: string, products: any[], budget?: number) {
  const prompt = `
Generate a helpful explanation for gift recommendations for a ${recipient}${occasion ? ` for ${occasion}` : ''}${budget ? ` with budget ₹${budget}` : ''}.

Products recommended:
${products.map(p => `- ${p.title} (₹${p.price}) - ${p.material || 'Material not specified'}`).join('\n')}

Provide a brief, friendly explanation of why these products are suitable for the recipient and occasion. Mention cultural significance if relevant.
Keep response under 150 words.
`

  try {
    return await generateText(prompt)
  } catch (error) {
    return `These products are carefully selected for ${recipient}${occasion ? ` for ${occasion}` : ''}. They represent quality Indian craftsmanship and are within an appropriate price range.`
  }
}

async function generateCulturalContext(query: string, products: any[]) {
  const prompt = `
Provide cultural context and significance for: ${query}

Related products found:
${products.map(p => `- ${p.title}: ${p.artForm || ''} ${p.origin || ''} ${p.culturalSignificance || ''}`).join('\n')}

Explain the cultural significance, traditional techniques, historical background, and regional importance. 
Keep response informative but under 200 words.
`

  try {
    return await generateText(prompt)
  } catch (error) {
    return `${query} represents rich Indian cultural heritage and traditional craftsmanship passed down through generations.`
  }
}

function analyzeUserPreferences(userHistory: any) {
  const favoriteArtForms: string[] = []
  const favoriteMaterials: string[] = []
  const avgPriceRange = { min: 0, max: 0 }

  try {
    // Extract preferences from order history
    const allProducts = [
      ...(userHistory.orders?.flatMap((o: any) => o.orderItems?.map((oi: any) => oi.product)) || []),
      ...(userHistory.wishlist?.map((w: any) => w.product) || []),
      ...(userHistory.cart?.map((c: any) => c.product) || [])
    ].filter(Boolean)

    // Analyze art forms
    const artFormCounts: { [key: string]: number } = {}
    const materialCounts: { [key: string]: number } = {}
    const prices: number[] = []

    for (const product of allProducts) {
      if (product.artForm) {
        artFormCounts[product.artForm] = (artFormCounts[product.artForm] || 0) + 1
      }
      if (product.material) {
        materialCounts[product.material] = (materialCounts[product.material] || 0) + 1
      }
      if (product.price) {
        prices.push(product.price)
      }
    }

    // Get top preferences
    favoriteArtForms.push(...Object.entries(artFormCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([artForm]) => artForm))

    favoriteMaterials.push(...Object.entries(materialCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([material]) => material))

    // Calculate price range
    if (prices.length > 0) {
      avgPriceRange.min = Math.min(...prices)
      avgPriceRange.max = Math.max(...prices)
    }
  } catch (error) {
    console.error('Error analyzing user preferences:', error)
  }

  return {
    favoriteArtForms,
    favoriteMaterials,
    avgPriceRange
  }
}

// Export all tools
export const agentTools: AgentTool[] = [
  productSearchTool,
  giftRecommendationTool,
  priceAnalysisTool,
  culturalContextTool,
  personalizedRecommendationTool
]
