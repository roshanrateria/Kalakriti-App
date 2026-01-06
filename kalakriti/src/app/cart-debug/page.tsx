'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'

export default function CartDebugPage() {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [courierData, setCourierData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCartAndCouriers()
    }
  }, [user])

  const fetchCartAndCouriers = async () => {
    try {
      // Fetch cart items
      const cartResponse = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      const cartData = await cartResponse.json()
      setCartItems(cartData.cartItems || [])

      console.log('Cart items:', cartData.cartItems)
      console.log('User pincode:', user?.pincode)

      // Fetch couriers for each seller
      if (cartData.cartItems && user?.pincode) {
        for (const item of cartData.cartItems) {
          const seller = item.product.seller
          console.log('Fetching couriers for seller:', seller.name, seller.pincode)

          if (seller.pincode) {
            const weight = (item.product.weight || 0.5) * item.quantity
            const response = await fetch('/api/delivery/couriers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pickupPincode: seller.pincode,
                deliveryPincode: user.pincode,
                weight: weight,
                cod: 0
              })
            })

            const data = await response.json()
            console.log(`Couriers for seller ${seller.id}:`, data)

            setCourierData(prev => ({
              ...prev,
              [seller.id]: data
            }))
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading debug info...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Cart Debug Information</h1>
      
      <div className="mb-6 bg-blue-50 p-4 rounded">
        <h2 className="font-bold mb-2">User Info:</h2>
        <pre className="text-sm">{JSON.stringify({ 
          name: user?.name,
          pincode: user?.pincode,
          address: user?.address
        }, null, 2)}</pre>
      </div>

      <div className="mb-6 bg-green-50 p-4 rounded">
        <h2 className="font-bold mb-2">Cart Items ({cartItems.length}):</h2>
        {cartItems.map(item => (
          <div key={item.id} className="mb-4 border-b pb-2">
            <div className="font-semibold">{item.product.title}</div>
            <div className="text-sm text-gray-600">
              Seller: {item.product.seller.name} (Pincode: {item.product.seller.pincode})
            </div>
            <div className="text-sm text-gray-600">
              Weight: {item.product.weight || 0.5}kg × {item.quantity} = {(item.product.weight || 0.5) * item.quantity}kg
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 bg-yellow-50 p-4 rounded">
        <h2 className="font-bold mb-2">Courier Data:</h2>
        {Object.entries(courierData).map(([sellerId, data]: [string, any]) => (
          <div key={sellerId} className="mb-4">
            <div className="font-semibold">Seller ID: {sellerId}</div>
            <div className="text-sm">Available: {data.available ? 'Yes' : 'No'}</div>
            <div className="text-sm">Couriers Count: {data.couriers?.length || 0}</div>
            {data.couriers && data.couriers.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold text-sm">First 3 couriers:</div>
                {data.couriers.slice(0, 3).map((courier: any) => (
                  <div key={courier.courierId} className="text-xs ml-4">
                    • {courier.courierName}: ₹{courier.deliveryCharge} ({courier.estimatedDays} days)
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={fetchCartAndCouriers}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Refresh Data
      </button>
    </div>
  )
}
