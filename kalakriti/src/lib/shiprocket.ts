/**
 * ShipRocket API Integration
 * Documentation: https://apidocs.shiprocket.in/
 */

// Types for ShipRocket API
interface ShipRocketAuthResponse {
  token: string
  expires_at: string
}

interface ShipRocketServiceability {
  available: boolean
  delivery_promise: {
    formatted_date: string
    date: string
  }
  cod_charges: number
  shipping_charges: number
  zone: string
  estimated_days: number
  courier_company_id: number
  courier_name: string
}

interface ShipRocketRateCalculation {
  courier_company_id: number
  courier_name: string
  rate: number
  estimated_delivery_days: string
  cod_charges: number
  freight_charge: number
  etd: string
  zone: string
}

interface DeliveryEstimate {
  available: boolean
  deliveryCharge: number
  codCharges: number
  estimatedDays: number
  estimatedDate: string
  formattedDate: string
  courierName: string
  zone: string
  breakdown: {
    freightCharge: number
    codCharges: number
    total: number
  }
  rawResponse?: any
}

interface CourierOption {
  courierId: number
  courierName: string
  deliveryCharge: number
  codCharges: number
  estimatedDays: number
  estimatedDate: string
  formattedDate: string
  zone: string
  rating: number
  breakdown: {
    freightCharge: number
    codCharges: number
    total: number
  }
  features: {
    callBeforeDelivery: string
    tracking: string
    pod: string
  }
}

interface AllCouriersResponse {
  available: boolean
  couriers: CourierOption[]
  recommendedCourierId: number
}

interface OrderShipmentPayload {
  order_id: string
  order_date: string
  pickup_location: string
  channel_id: string
  billing_customer_name: string
  billing_last_name: string
  billing_address: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string
  shipping_is_billing: boolean
  order_items: Array<{
    name: string
    sku: string
    units: number
    selling_price: string
    discount: string
    tax: string
  }>
  payment_method: string
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
}

// Cache for authentication token
let cachedToken: string | null = null
let tokenExpiresAt: Date | null = null

/**
 * Get ShipRocket authentication token
 * The token is valid for 10 days and is cached for 9 days
 */
async function getAuthToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
    console.log('[ShipRocket] Using cached authentication token')
    return cachedToken
  }

  const email = process.env.SHIPROCKET_EMAIL
  const password = process.env.SHIPROCKET_PASSWORD

  if (!email || !password) {
    const error = 'ShipRocket credentials not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in environment variables.'
    console.error('[ShipRocket] Authentication Error:', error)
    throw new Error(error)
  }

  console.log('[ShipRocket] Requesting new authentication token...')

  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ShipRocket] Authentication failed:', response.status, errorText)
      throw new Error(`ShipRocket authentication failed (${response.status}): ${errorText}`)
    }

    const data: ShipRocketAuthResponse = await response.json()
    
    if (!data.token) {
      console.error('[ShipRocket] No token in response:', data)
      throw new Error('ShipRocket authentication response missing token')
    }

    cachedToken = data.token
    
    // Token expires in 10 days, cache for 9 days to be safe
    tokenExpiresAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000)
    
    console.log('[ShipRocket] Successfully authenticated. Token valid until:', tokenExpiresAt.toISOString())
    
    return cachedToken
  } catch (error) {
    console.error('[ShipRocket] Error authenticating:', error)
    // Clear cached token on error
    cachedToken = null
    tokenExpiresAt = null
    throw error
  }
}

/**
 * Check serviceability and get delivery estimate
 */
export async function checkServiceability(
  pickupPincode: string,
  deliveryPincode: string,
  weight: number = 0.5, // Default 500g
  cod: number = 0 // COD amount, 0 for prepaid
): Promise<DeliveryEstimate> {
  try {
    console.log('[ShipRocket] Checking serviceability:', { pickupPincode, deliveryPincode, weight, cod })
    
    const token = await getAuthToken()

    // Build URL with query parameters
    const url = new URL('https://apiv2.shiprocket.in/v1/external/courier/serviceability/')
    url.searchParams.append('pickup_postcode', pickupPincode)
    url.searchParams.append('delivery_postcode', deliveryPincode)
    url.searchParams.append('weight', weight.toString())
    url.searchParams.append('cod', cod.toString())

    console.log('[ShipRocket] Requesting:', url.toString())

    const serviceabilityResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!serviceabilityResponse.ok) {
      const errorText = await serviceabilityResponse.text()
      console.error('[ShipRocket] Serviceability check failed:', serviceabilityResponse.status, errorText)
      return getFallbackEstimate()
    }

    const data = await serviceabilityResponse.json()
    console.log('[ShipRocket] Serviceability response:', JSON.stringify(data, null, 2))

    // ShipRocket returns available couriers with their rates
    if (data.data && data.data.available_courier_companies && data.data.available_courier_companies.length > 0) {
      console.log('[ShipRocket] Found', data.data.available_courier_companies.length, 'available couriers')
      
      // Get the cheapest/fastest courier
      const bestCourier = data.data.available_courier_companies.reduce((best: any, current: any) => {
        const bestRate = parseFloat(best.rate || best.freight_charge || 0)
        const currentRate = parseFloat(current.rate || current.freight_charge || 0)
        return currentRate < bestRate ? current : best
      })      
      const freightCharge = parseFloat(bestCourier.freight_charge || bestCourier.rate || 0)
      const codCharges = parseFloat(bestCourier.cod_charges || 0)
      const totalCharge = freightCharge + codCharges

      console.log('[ShipRocket] Best courier selected:', {
        name: bestCourier.courier_name,
        freightCharge,
        codCharges,
        totalCharge,
        estimatedDays: bestCourier.estimated_delivery_days
      })

      const result = {
        available: true,
        deliveryCharge: Math.round(totalCharge),
        codCharges: Math.round(codCharges),
        estimatedDays: parseInt(bestCourier.estimated_delivery_days || bestCourier.etd || '3'),
        estimatedDate: bestCourier.etd || calculateEstimatedDate(parseInt(bestCourier.estimated_delivery_days || '3')),
        formattedDate: formatDeliveryDate(bestCourier.etd || calculateEstimatedDate(parseInt(bestCourier.estimated_delivery_days || '3'))),
        courierName: bestCourier.courier_name || 'ShipRocket Courier',
        zone: bestCourier.zone || 'Unknown',
        breakdown: {
          freightCharge: Math.round(freightCharge),
          codCharges: Math.round(codCharges),
          total: Math.round(totalCharge)
        },
        rawResponse: bestCourier
      }

      console.log('[ShipRocket] Delivery estimate calculated:', result)
      return result
    }

    console.log('[ShipRocket] No available couriers found, using fallback')
    return getFallbackEstimate()
  } catch (error) {
    console.error('[ShipRocket] Error checking serviceability:', error)
    return getFallbackEstimate()
  }
}

/**
 * Get all available courier options for a delivery
 */
export async function getAllCourierOptions(
  pickupPincode: string,
  deliveryPincode: string,
  weight: number = 0.5,
  cod: number = 0
): Promise<AllCouriersResponse> {
  try {
    console.log('[ShipRocket] Fetching all courier options:', { pickupPincode, deliveryPincode, weight, cod })
    
    const token = await getAuthToken()

    const url = new URL('https://apiv2.shiprocket.in/v1/external/courier/serviceability/')
    url.searchParams.append('pickup_postcode', pickupPincode)
    url.searchParams.append('delivery_postcode', deliveryPincode)
    url.searchParams.append('weight', weight.toString())
    url.searchParams.append('cod', cod.toString())

    const serviceabilityResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!serviceabilityResponse.ok) {
      console.error('[ShipRocket] Failed to fetch couriers')
      return {
        available: false,
        couriers: [],
        recommendedCourierId: 0
      }
    }

    const data = await serviceabilityResponse.json()

    if (data.data && data.data.available_courier_companies && data.data.available_courier_companies.length > 0) {
      const couriers: CourierOption[] = data.data.available_courier_companies.map((courier: any) => {
        const freightCharge = parseFloat(courier.freight_charge || courier.rate || 0)
        const codCharges = parseFloat(courier.cod_charges || 0)
        const totalCharge = freightCharge + codCharges

        return {
          courierId: courier.courier_company_id || courier.id,
          courierName: courier.courier_name || 'Unknown Courier',
          deliveryCharge: Math.round(totalCharge),
          codCharges: Math.round(codCharges),
          estimatedDays: parseInt(courier.estimated_delivery_days || '3'),
          estimatedDate: courier.etd || calculateEstimatedDate(parseInt(courier.estimated_delivery_days || '3')),
          formattedDate: formatDeliveryDate(courier.etd || calculateEstimatedDate(parseInt(courier.estimated_delivery_days || '3'))),
          zone: courier.zone || 'Unknown',
          rating: parseFloat(courier.rating || '4.0'),
          breakdown: {
            freightCharge: Math.round(freightCharge),
            codCharges: Math.round(codCharges),
            total: Math.round(totalCharge)
          },
          features: {
            callBeforeDelivery: courier.call_before_delivery || 'Not Available',
            tracking: courier.realtime_tracking || 'Available',
            pod: courier.pod_available || 'On Request'
          }
        }
      })

      // Sort by price (cheapest first)
      couriers.sort((a, b) => a.deliveryCharge - b.deliveryCharge)

      return {
        available: true,
        couriers,
        recommendedCourierId: data.data.recommended_courier_company_id || couriers[0].courierId
      }
    }

    return {
      available: false,
      couriers: [],
      recommendedCourierId: 0
    }
  } catch (error) {
    console.error('[ShipRocket] Error fetching courier options:', error)
    return {
      available: false,
      couriers: [],
      recommendedCourierId: 0
    }
  }
}

/**
 * Calculate delivery charges based on pickup and delivery pincodes
 */
export async function calculateDeliveryCharge(
  pickupPincode: string,
  deliveryPincode: string,
  weight: number = 0.5,
  cod: number = 0,
  dimensions?: { length: number; breadth: number; height: number }
): Promise<DeliveryEstimate> {
  return await checkServiceability(pickupPincode, deliveryPincode, weight, cod)
}

/**
 * Get rate calculator for multiple courier options
 */
export async function getRateCalculator(
  pickupPincode: string,
  deliveryPincode: string,
  weight: number,
  cod: number = 0,
  declaredValue: number
): Promise<ShipRocketRateCalculation[]> {
  try {
    const token = await getAuthToken()

    const url = new URL('https://apiv2.shiprocket.in/v1/external/courier/courierListWithCounts')
    url.searchParams.append('pickup_postcode', pickupPincode)
    url.searchParams.append('delivery_postcode', deliveryPincode)
    url.searchParams.append('weight', weight.toString())
    url.searchParams.append('cod', cod.toString())
    url.searchParams.append('declared_value', declaredValue.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get rate calculations')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error getting rate calculator:', error)
    return []
  }
}

/**
 * Create a hypothetical order (for testing - NOT creating actual shipment)
 * This validates the order data but DOES NOT create an actual shipment
 */
export async function createHypotheticalOrder(orderData: OrderShipmentPayload): Promise<{
  success: boolean
  orderId: string
  shipmentId?: string
  message: string
  validatedData: any
}> {
  // IMPORTANT: This is a MOCK function that validates data structure
  // without creating actual ShipRocket orders
  
  try {
    // Validate required fields
    const requiredFields = [
      'order_id', 'order_date', 'billing_customer_name',
      'billing_address', 'billing_pincode', 'billing_phone',
      'billing_email', 'order_items'
    ]

    for (const field of requiredFields) {
      if (!orderData[field as keyof OrderShipmentPayload]) {
        return {
          success: false,
          orderId: orderData.order_id,
          message: `Missing required field: ${field}`,
          validatedData: null
        }
      }
    }

    // Validate pincode format (6 digits for India)
    if (!/^\d{6}$/.test(orderData.billing_pincode)) {
      return {
        success: false,
        orderId: orderData.order_id,
        message: 'Invalid pincode format. Must be 6 digits.',
        validatedData: null
      }
    }

    // Validate order items
    if (!Array.isArray(orderData.order_items) || orderData.order_items.length === 0) {
      return {
        success: false,
        orderId: orderData.order_id,
        message: 'Order must contain at least one item',
        validatedData: null
      }
    }

    // Mock successful validation
    return {
      success: true,
      orderId: orderData.order_id,
      shipmentId: `SHIP-MOCK-${Date.now()}`,
      message: 'Order validated successfully (HYPOTHETICAL - not created in ShipRocket)',
      validatedData: orderData
    }

    // ACTUAL API CALL (commented out for safety):
    /*
    const token = await getAuthToken()
    
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`ShipRocket order creation failed: ${JSON.stringify(error)}`)
    }

    const result = await response.json()
    return {
      success: true,
      orderId: result.order_id,
      shipmentId: result.shipment_id,
      message: 'Order created successfully',
      validatedData: result
    }
    */
  } catch (error) {
    console.error('Error creating hypothetical order:', error)
    return {
      success: false,
      orderId: orderData.order_id,
      message: error instanceof Error ? error.message : 'Unknown error',
      validatedData: null
    }
  }
}

/**
 * Track shipment by order ID or AWB number
 */
export async function trackShipment(shipmentId: string): Promise<any> {
  try {
    const token = await getAuthToken()

    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to track shipment')
    }

    return await response.json()
  } catch (error) {
    console.error('Error tracking shipment:', error)
    return null
  }
}

/**
 * Get pickup locations for seller
 */
export async function getPickupLocations(): Promise<any[]> {
  try {
    const token = await getAuthToken()

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get pickup locations')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error getting pickup locations:', error)
    return []
  }
}

// Helper functions

function calculateEstimatedDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

function formatDeliveryDate(dateString: string): string {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
  return date.toLocaleDateString('en-IN', options)
}

function getFallbackEstimate(): DeliveryEstimate {
  // Fallback estimation when ShipRocket is not available
  const estimatedDays = 5
  const estimatedDate = calculateEstimatedDate(estimatedDays)
  
  return {
    available: true,
    deliveryCharge: 50, // Fallback flat rate
    codCharges: 0,
    estimatedDays,
    estimatedDate,
    formattedDate: formatDeliveryDate(estimatedDate),
    courierName: 'Standard Delivery',
    zone: 'Local',
    breakdown: {
      freightCharge: 50,
      codCharges: 0,
      total: 50
    }
  }
}

/**
 * Extract pincode from address string
 */
export function extractPincode(address: string): string | null {
  // Match 6-digit Indian pincode
  const match = address.match(/\b\d{6}\b/)
  return match ? match[0] : null
}

/**
 * Validate Indian pincode
 */
export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode)
}
