'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Trash2, Plus, Minus, ShoppingBag, MapPin, CreditCard, Navigation, Package, Truck, Calendar } from 'lucide-react'
import { toast } from '@/components/ui/Toaster'
import QRCode from 'qrcode'
import { TranslatedText } from '@/components/TranslatedText'
import { useTranslation } from '@/contexts/TranslationContext'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: string
  quantity: number
  acceptedOfferId?: string | null
  specialPrice?: number | null
  product: {
    id: string
    title: string
    price: number
    images: string[]
    inStock: boolean
    weight?: number
    seller: {
      id: string
      name: string
      address?: string
      pincode?: string
      latitude?: number
      longitude?: number
    }
  }
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

interface DeliveryInfo {
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
}

export default function CartPage() {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deliveryCharges, setDeliveryCharges] = useState<Record<string, DeliveryInfo>>({})
  const [availableCouriers, setAvailableCouriers] = useState<Record<string, CourierOption[]>>({})
  const [selectedCouriers, setSelectedCouriers] = useState<Record<string, number>>({})
  const [showCourierOptions, setShowCourierOptions] = useState<Record<string, boolean>>({})
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'payment' | 'confirmation'>('payment')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [orderTotal, setOrderTotal] = useState(0)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role === 'BUYER') {
      fetchCartItems()
    }
  }, [user])
  
  useEffect(() => {
    calculateAllDeliveryCharges()
  }, [cartItems, user])

  // Helper function to get effective price (special price if available, otherwise regular price)
  const getEffectivePrice = (item: CartItem) => {
    return item.specialPrice || item.product.price
  }

  const fetchCartItems = async () => {
    if (!token) return
    
    try {
      const response = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCartItems(data.cartItems)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      toast.error(await translate('Failed to load cart'))    } finally {
      setLoading(false)
    }
  }
    const calculateAllDeliveryCharges = async () => {
    if (!user?.pincode) {
      // Show message if pincode is not set
      if (cartItems.length > 0) {
        toast.info(await translate('Please set your pincode in profile for accurate delivery charges'))
      }
      return
    }

    console.log('🚚 Calculating delivery charges for', cartItems.length, 'items')
    console.log('📍 User pincode:', user.pincode)

    const charges: Record<string, DeliveryInfo> = {}
    const couriersMap: Record<string, CourierOption[]> = {}
    const selectedMap: Record<string, number> = {}
    
    for (const item of cartItems) {
      const seller = item.product.seller
      console.log('👤 Processing seller:', seller.name, 'Pincode:', seller.pincode)
        if (seller.pincode) {
        try {
          // Calculate total weight for this seller's items (convert grams to kg)
          const weightInGrams = item.product.weight || 500 // Default 500g
          const weightInKg = (weightInGrams / 1000) * item.quantity
          console.log('⚖️  Weight:', weightInKg, 'kg (', weightInGrams, 'g per item )')
          
          // Fetch all available courier options
          const response = await fetch('/api/delivery/couriers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },            body: JSON.stringify({
              pickupPincode: seller.pincode,
              deliveryPincode: user.pincode,
              weight: weightInKg,
              cod: 0 // Prepaid for now
            })
          })

          if (response.ok) {
            const data = await response.json()
            console.log('📦 Received couriers for seller', seller.id, ':', data.couriers?.length || 0, 'options')
            
            if (data.available && data.couriers && data.couriers.length > 0) {
              couriersMap[seller.id] = data.couriers
              console.log('✅ Stored', data.couriers.length, 'couriers for seller', seller.id)
              
              // Set cheapest courier as default selected
              const cheapestCourier = data.couriers[0]
              selectedMap[seller.id] = cheapestCourier.courierId
              
              // Set default delivery charge from cheapest courier
              charges[seller.id] = {
                available: true,
                deliveryCharge: cheapestCourier.deliveryCharge,
                codCharges: cheapestCourier.codCharges,
                estimatedDays: cheapestCourier.estimatedDays,
                estimatedDate: cheapestCourier.estimatedDate,
                formattedDate: cheapestCourier.formattedDate,
                courierName: cheapestCourier.courierName,
                zone: cheapestCourier.zone,
                breakdown: cheapestCourier.breakdown
              }
              console.log('💰 Default courier:', cheapestCourier.courierName, '₹', cheapestCourier.deliveryCharge)
            }
          } else {
            console.error('❌ Failed to fetch couriers for seller:', seller.id, response.status)
          }
        } catch (error) {
          console.error('❌ Error fetching couriers for seller:', seller.id, error)
        }
      } else {
        // Fallback if seller doesn't have pincode
        charges[seller.id] = {
          available: true,
          deliveryCharge: 50,
          codCharges: 0,
          estimatedDays: 5,
          estimatedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          formattedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          courierName: 'Standard Delivery',
          zone: 'Local',
          breakdown: {
            freightCharge: 50,
            codCharges: 0,
            total: 50
          }        }
      }
    }
    
    console.log('📊 Final state:')
    console.log('  - Charges:', Object.keys(charges).length, 'sellers')
    console.log('  - Couriers map:', Object.keys(couriersMap).length, 'sellers')
    console.log('  - Couriers details:', Object.entries(couriersMap).map(([id, c]) => `${id}: ${c.length} options`))
    
    setDeliveryCharges(charges)
    setAvailableCouriers(couriersMap)
    setSelectedCouriers(selectedMap)
    
    console.log('✅ State updated!')
  }

  const selectCourier = (sellerId: string, courierId: number) => {
    const courier = availableCouriers[sellerId]?.find(c => c.courierId === courierId)
    if (courier) {
      setSelectedCouriers(prev => ({ ...prev, [sellerId]: courierId }))
      setDeliveryCharges(prev => ({
        ...prev,
        [sellerId]: {
          available: true,
          deliveryCharge: courier.deliveryCharge,
          codCharges: courier.codCharges,
          estimatedDays: courier.estimatedDays,
          estimatedDate: courier.estimatedDate,
          formattedDate: courier.formattedDate,
          courierName: courier.courierName,
          zone: courier.zone,
          breakdown: courier.breakdown
        }
      }))
    }
  }

  const toggleCourierOptions = (sellerId: string) => {
    setShowCourierOptions(prev => ({
      ...prev,
      [sellerId]: !prev[sellerId]
    }))
  }

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId)
      return
    }

    // Optimistic update
    setCartItems(prev => prev.map(item => 
      item.id === cartItemId ? { ...item, quantity: newQuantity } : item
    ))
    
    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cartItemId, quantity: newQuantity })
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(await translate(errorData.error || 'Failed to update quantity'))
        fetchCartItems() // Revert on error
      } else {
        const successMsg = await translate('Quantity updated')
        toast.success(successMsg)
      }
    } catch (error) {
      toast.error(await translate('Error updating quantity'))
      fetchCartItems()
    }
  }

  const removeFromCart = async (cartItemId: string) => {
    try {
      const response = await fetch(`/api/cart?id=${cartItemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setCartItems(prev => prev.filter(item => item.id !== cartItemId))
        toast.success(await translate('Item removed from cart'))
      } else {
        toast.error(await translate('Failed to remove item'))
      }
    } catch (error) {
      toast.error(await translate('Error removing item'))
    }
  }
  
  const proceedToCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error(await translate('Your cart is empty'))
      return
    }
    
    if (!user?.address) {
      toast.error(await translate('Please update your address in profile before checkout'))
      return
    }
      setShowCheckout(true)
    setPaymentStep('payment')
    generatePaymentQR()
  }
  
  const generatePaymentQR = async () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (getEffectivePrice(item) * item.quantity), 0)
    const totalDelivery = Object.values(deliveryCharges).reduce((sum, charge) => sum + charge.deliveryCharge, 0)
    const total = subtotal + totalDelivery
    setOrderTotal(total)

    // Group items by seller for payment
    const sellerGroups = cartItems.reduce((groups, item) => {
      const sellerId = item.product.seller.id
      if (!groups[sellerId]) {
        groups[sellerId] = {
          seller: item.product.seller,
          items: [],
          subtotal: 0
        }      }
      groups[sellerId].items.push(item)
      groups[sellerId].subtotal += getEffectivePrice(item) * item.quantity
      return groups
    }, {} as Record<string, any>)

    // For demo, we'll show the first seller's UPI ID
    const firstSeller = Object.values(sellerGroups)[0] as any
    const seller = await fetch(`/api/users/${firstSeller.seller.id}`).then(r => r.json())
    
    if (seller.upiId) {
      const upiString = `upi://pay?pa=${seller.upiId}&pn=${seller.name}&am=${total}&cu=INR&tn=Kalakriti Order Payment`
      const qrUrl = await QRCode.toDataURL(upiString)
      setQrCodeUrl(qrUrl)
    }
  }
  const confirmPayment = async () => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cartItems,
          deliveryAddress: user?.address, // Use buyer's saved address
          deliveryCharges
        })
      })

      if (response.ok) {
        const orderData = await response.json()
        setCreatedOrderId(orderData.id)
        setPaymentStep('confirmation')
        setCartItems([]) // Clear cart
        toast.success(await translate('Order placed successfully!'))
      } else {
        toast.error(await translate('Failed to place order'))
      }
    } catch (error) {
      toast.error(await translate('Error placing order'))
    }  }
  const subtotal = cartItems.reduce((sum, item) => sum + (getEffectivePrice(item) * item.quantity), 0)
  const totalDelivery = Object.values(deliveryCharges).reduce((sum, charge) => sum + charge.deliveryCharge, 0)
  const total = subtotal + totalDelivery

  if (user?.role !== 'BUYER') {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            <TranslatedText text="Access Restricted" />
          </h2>
          <p className="text-gray-500">
            <TranslatedText text="Only buyers can access the cart" />
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex space-x-4">
                  <div className="bg-gray-200 w-20 h-20 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                    <div className="bg-gray-200 h-6 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (showCheckout) {
    return (
      <div className="min-h-screen py-12 px-4">        
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {paymentStep === 'payment' && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  <TranslatedText text="Order Summary & Payment" />
                </h2>
                
                {/* Delivery Address Section */}
                <div className="bg-blue-50 p-4 rounded-xl mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    <TranslatedText text="Delivery Address" />
                  </h3>
                  <p className="text-gray-700">{user?.address}</p>
                </div>                {/* Delivery Charges Breakdown */}
                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    <Truck className="w-4 h-4 inline mr-1" />
                    <TranslatedText text="Delivery Charges Breakdown" />
                  </h3>                  {Object.entries(deliveryCharges).map(([sellerId, charge]) => {
                    const seller = cartItems.find(item => item.product.seller.id === sellerId)?.product.seller
                    const selectedCourierId = selectedCouriers[sellerId]
                    const isRecommended = availableCouriers[sellerId]?.some(c => c.courierId === selectedCourierId)
                    return (
                      <div key={sellerId} className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="font-medium block">{seller?.name}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              {charge.courierName}
                              {isRecommended && <span className="text-green-600">✓ Selected</span>}
                            </span>
                          </div>
                          <span className="font-bold text-orange-600">₹{charge.deliveryCharge}</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Freight charge:</span>
                            <span>₹{charge.breakdown.freightCharge}</span>
                          </div>
                          {charge.codCharges > 0 && (
                            <div className="flex justify-between">
                              <span>COD charges:</span>
                              <span>₹{charge.codCharges}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Estimated delivery:
                            </span>
                            <span className="font-medium">{charge.estimatedDays} days</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Expected by: {charge.formattedDate}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="text-center space-y-6">
                  <div className="bg-orange-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      <TranslatedText text="Total Amount" />
                    </h3>
                    <p className="text-3xl font-bold text-orange-600">₹{orderTotal.toLocaleString()}</p>
                  </div>
                  
                  {qrCodeUrl && (
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        <TranslatedText text="Scan the QR code below to pay via UPI:" />
                      </p>
                      <img src={qrCodeUrl} alt="Payment QR Code" className="mx-auto w-48 h-48" />
                      <p className="text-sm text-gray-500">
                        <TranslatedText text="Or use any UPI app to scan and pay" />
                      </p>
                    </div>
                  )}
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
                    >
                      <TranslatedText text="Back to Cart" />
                    </button>
                    <button
                      onClick={confirmPayment}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700"
                    >
                      <TranslatedText text="I've Paid" />
                    </button>                  </div>
                </div>              
              </>
            )}
            
            {paymentStep === 'confirmation' && (
              <div className="text-center space-y-6">
                <div className="text-green-600">
                  <CreditCard className="w-16 h-16 mx-auto mb-4" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  <TranslatedText text="Order Placed Successfully!" />
                </h2>
                <p className="text-gray-600">
                  <TranslatedText text="Thank you for your order. You will receive a confirmation email shortly." />
                </p>
                
                {/* Order ID Display */}
                {createdOrderId && (
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">
                      <TranslatedText text="Order ID" />
                    </p>
                    <p className="font-mono text-lg font-semibold text-blue-800">
                      #{createdOrderId.slice(-8)}
                    </p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {createdOrderId && (
                    <button
                      onClick={() => router.push(`/navigate/${createdOrderId}`)}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center justify-center"
                    >
                      <Navigation className="w-5 h-5 mr-2" />
                      <TranslatedText text="Start Navigation" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => router.push('/orders')}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700"
                  >
                    <TranslatedText text="View Orders" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowCheckout(false)
                      setPaymentStep('payment')
                      setCreatedOrderId(null)
                    }}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600"
                  >
                    <TranslatedText text="Continue Shopping" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            <TranslatedText text="Shopping Cart" />
          </h1>
          <p className="text-gray-600">
            {cartItems.length} <TranslatedText text="items in your cart" />
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              <TranslatedText text="Your cart is empty" />
            </h3>
            <p className="text-gray-500 mb-6">
              <TranslatedText text="Add some products to get started" />
            </p>
            <a
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600"
            >
              <TranslatedText text="Browse Products" />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg overflow-hidden">
                      {item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-orange-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        <TranslatedText text={item.product.title} />
                      </h3>                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>
                          <TranslatedText text="Sold by" /> {item.product.seller.name}
                        </span>
                      </div>
                      
                      {/* Price Display - Show special price if available */}
                      <div className="flex items-center gap-2">
                        {item.specialPrice ? (
                          <>
                            <p className="text-lg font-bold text-green-600">₹{item.specialPrice.toLocaleString()}</p>
                            <p className="text-sm text-gray-400 line-through">₹{item.product.price.toLocaleString()}</p>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                              Bargain Price! 🎉
                            </span>
                          </>
                        ) : (
                          <p className="text-lg font-bold text-orange-600">₹{item.product.price.toLocaleString()}</p>
                        )}
                      </div>                      {deliveryCharges[item.product.seller.id] && (
                        <div className="mt-2">
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            <TranslatedText text="Delivery" />: ₹{deliveryCharges[item.product.seller.id].deliveryCharge}
                            <span className="text-xs">({deliveryCharges[item.product.seller.id].estimatedDays} days)</span>
                          </div>
                          
                          {/* Show/Hide Courier Options Button */}
                          {availableCouriers[item.product.seller.id] && availableCouriers[item.product.seller.id].length > 1 && (
                            <button
                              onClick={() => toggleCourierOptions(item.product.seller.id)}
                              className="text-sm text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              {showCourierOptions[item.product.seller.id] ? '▼' : '▶'} 
                              <TranslatedText text="See all delivery options" /> ({availableCouriers[item.product.seller.id].length})
                            </button>
                          )}
                          
                          {/* Debug info - remove this later */}
                          <div className="text-xs text-red-500 mt-1">
                            Debug: {availableCouriers[item.product.seller.id]?.length || 0} courier options available
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Courier Options Panel */}
                  {showCourierOptions[item.product.seller.id] && availableCouriers[item.product.seller.id] && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        <Package className="w-4 h-4 inline mr-1" />
                        <TranslatedText text="Select Delivery Option" />
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableCouriers[item.product.seller.id].map((courier) => (
                          <div
                            key={courier.courierId}
                            onClick={() => selectCourier(item.product.seller.id, courier.courierId)}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedCouriers[item.product.seller.id] === courier.courierId
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-800">{courier.courierName}</span>
                                  {selectedCouriers[item.product.seller.id] === courier.courierId && (
                                    <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">Selected</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                  <div>⭐ Rating: {courier.rating}/5</div>
                                  <div>📦 Zone: {courier.zone}</div>
                                  <div>📞 {courier.features.callBeforeDelivery}</div>
                                  <div>🔍 {courier.features.tracking}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-orange-600">₹{courier.deliveryCharge}</div>
                                <div className="text-xs text-gray-500">{courier.estimatedDays} days</div>
                                <div className="text-xs text-gray-400">{courier.formattedDate}</div>
                              </div>
                            </div>
                            {courier.breakdown && (
                              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                                <div className="flex justify-between">
                                  <span>Freight:</span>
                                  <span>₹{courier.breakdown.freightCharge}</span>
                                </div>
                                {courier.breakdown.codCharges > 0 && (
                                  <div className="flex justify-between">
                                    <span>COD:</span>
                                    <span>₹{courier.breakdown.codCharges}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  <TranslatedText text="Order Summary" />
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      <TranslatedText text="Subtotal" />
                    </span>
                    <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                  </div>
                    {/* Delivery Breakdown */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>
                        <TranslatedText text="Delivery Charges:" />
                      </span>
                    </div>
                    {Object.entries(deliveryCharges).map(([sellerId, charge]) => {
                      const seller = cartItems.find(item => item.product.seller.id === sellerId)?.product.seller
                      return (
                        <div key={sellerId} className="text-sm text-gray-600 ml-2 mb-2">
                          <div className="flex justify-between">
                            <span>{seller?.name}</span>
                            <span>₹{charge.deliveryCharge}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {charge.courierName} - {charge.estimatedDays} days
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">
                        <TranslatedText text="Total Delivery" />
                      </span>
                      <span className="font-semibold">₹{totalDelivery.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <hr className="my-4" />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">
                      <TranslatedText text="Total" />
                    </span>
                    <span className="font-bold text-orange-600">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={proceedToCheckout}
                  className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 font-semibold"
                >
                  <TranslatedText text="Proceed to Checkout" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
