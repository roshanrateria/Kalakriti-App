'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useTranslation } from '@/contexts/TranslationContext'
import { TranslatedText } from '@/components/TranslatedText'
import { Plus, Package, TrendingUp, Users, Edit, Trash2, Eye, ToggleLeft, ToggleRight, MapPin, Truck, TrendingDown, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/Toaster'
import dynamic from 'next/dynamic'

// Dynamically import the delivery map component to avoid SSR issues
const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), { ssr: false })
const OffersManagement = dynamic(() => import('@/components/OffersManagement'), { ssr: false })

interface Product {
  id: string
  title: string
  description: string
  tagline?: string
  price: number
  images: string[]
  inStock: boolean
  stockQuantity: number
  tags: string[]
  createdAt: string
  // Discount & Pricing fields
  originalPrice?: number
  discountPercent?: number
  discountAmount?: number
  discountStart?: string
  discountEnd?: string
  isFeatured?: boolean
  // Artisan-specific fields
  material?: string
  technique?: string
  artForm?: string
  origin?: string
}

interface Order {
  id: string
  totalAmount: number
  status: string
  paymentStatus: string
  deliveryAddress: string
  deliveryLatitude: number
  deliveryLongitude: number
  deliveryPincode?: string
  deliveryCity?: string
  deliveryState?: string
  courierName?: string
  estimatedDeliveryDate?: string
  createdAt: string
  buyer: {
    name: string
    email: string
    phone?: string
  }
  orderItems: {
    id: string
    quantity: number
    price: number
    product: {
      title: string
    }
  }[]
}

export default function SellerDashboard() {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'delivery' | 'offers'>('overview')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showOffersModal, setShowOffersModal] = useState(false)
  const [translatedOptions, setTranslatedOptions] = useState({
    pending: 'Pending',
    confirmed: 'Confirmed',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  })
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    featuredProducts: 0,
    activeDiscounts: 0,
    discountSavings: 0,
    ordersToShipToday: 0,
    shippedOrders: 0
  })

  useEffect(() => {
    if (user?.role === 'SELLER') {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    const translateOptions = async () => {
      const options = await Promise.all([
        translate('Pending'),
        translate('Confirmed'),
        translate('Delivered'),
        translate('Cancelled')
      ])
      setTranslatedOptions({
        pending: options[0],
        confirmed: options[1],
        delivered: options[2],
        cancelled: options[3]
      })
    }
    translateOptions()
  }, [translate])

  const fetchData = async () => {
    if (!token) return

    try {
      setLoading(true)

      let products: any[] = []
      let orders: any[] = []

      // Fetch products
      const productsResponse = await fetch('/api/seller/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        products = productsData.products || []
        setProducts(products)
      }

      // Fetch orders
      const ordersResponse = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        orders = ordersData.orders || []
        setOrders(orders)

        // Calculate stats
        const totalRevenue = orders
          .filter((order: Order) => order.paymentStatus === 'PAID')
          .reduce((sum: number, order: Order) => sum + order.totalAmount, 0)

        const pendingOrders = orders
          .filter((order: Order) => order.status === 'PENDING').length

        // Calculate orders that need shipping today (confirmed but not delivered/cancelled)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const ordersToShipToday = orders.filter((order: Order) => {
          if (!order.estimatedDeliveryDate) return false
          const deliveryDate = new Date(order.estimatedDeliveryDate)
          deliveryDate.setHours(0, 0, 0, 0)
          return deliveryDate.getTime() === today.getTime() &&
            (order.status === 'CONFIRMED' || order.status === 'PENDING')
        }).length

        const shippedOrders = orders.filter((order: Order) =>
          order.status === 'SHIPPED' || order.status === 'DELIVERED'
        ).length

        const lowStockProducts = products
          .filter((product: Product) => product.inStock && product.stockQuantity <= 5).length

        const featuredProducts = products
          .filter((product: Product) => product.isFeatured).length

        const now = new Date()
        const activeDiscounts = products
          .filter((product: Product) => {
            if (!product.discountStart || !product.discountEnd) return false
            const start = new Date(product.discountStart)
            const end = new Date(product.discountEnd)
            return now >= start && now <= end
          }).length

        const discountSavings = products
          .filter((product: Product) => product.originalPrice && product.originalPrice > product.price)
          .reduce((sum: number, product: Product) => {
            return sum + ((product.originalPrice || 0) - product.price)
          }, 0)

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue,
          pendingOrders,
          lowStockProducts,
          featuredProducts,
          activeDiscounts,
          discountSavings,
          ordersToShipToday,
          shippedOrders
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error(await translate('Failed to load dashboard data'))
    } finally {
      setLoading(false)
    }
  }
  const toggleProductStock = async (productId: string, currentStock: boolean) => {
    try {
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inStock: !currentStock })
      })

      if (response.ok) {
        setProducts(prev => prev.map(product =>
          product.id === productId
            ? { ...product, inStock: !currentStock }
            : product
        ))
        const message = !currentStock ? 'Product marked as in stock' : 'Product marked as out of stock'
        toast.success(await translate(message))
      } else {
        toast.error(await translate('Failed to update product stock'))
      }
    } catch (error) {
      toast.error(await translate('Error updating product stock'))
    }
  }
  const deleteProduct = async (productId: string) => {
    const confirmMessage = await translate('Are you sure you want to delete this product?')
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setProducts(prev => prev.filter(product => product.id !== productId))
        toast.success(await translate('Product deleted successfully'))
      } else {
        toast.error(await translate('Failed to delete product'))
      }
    } catch (error) {
      toast.error(await translate('Error deleting product'))
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, body: JSON.stringify({ status })
      })

      if (response.ok) {
        setOrders(prev => prev.map(order =>
          order.id === orderId ? { ...order, status } : order
        ))
        toast.success(await translate('Order status updated'))
      } else {
        toast.error(await translate('Failed to update order status'))
      }
    } catch (error) {
      toast.error(await translate('Error updating order status'))
    }
  }
  if (user?.role !== 'SELLER') {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            <TranslatedText text="Access Restricted" />
          </h2>
          <p className="text-gray-500">
            <TranslatedText text="Only sellers can access the dashboard" />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-7xl mx-auto">        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            <TranslatedText text="Seller Dashboard" />
          </h1>
          <p className="text-gray-600">
            <TranslatedText text="Welcome back" />, {user.name}!
          </p>
        </div>        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-8 stagger-animation">          <div className="morph-card interactive-element animate-fade-in-up opacity-0 group p-6" style={{ '--i': '0', animationDelay: '0.1s', animationFillMode: 'forwards' } as any}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600 transition-colors">
                <TranslatedText text="Total Products" />
              </p>
              <p className="text-2xl font-bold text-gray-900 price-highlight group-hover:animate-bounce-gentle">{stats.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-orange-600 group-hover:animate-wiggle group-hover:scale-110 transition-all duration-300" />
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          </div>
        </div>

          <div className="morph-card interactive-element animate-fade-in-up opacity-0 group p-6" style={{ '--i': '1', animationDelay: '0.2s', animationFillMode: 'forwards' } as any}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                  <TranslatedText text="Total Orders" />
                </p>
                <p className="text-2xl font-bold text-gray-900 price-highlight group-hover:animate-bounce-gentle">{stats.totalOrders}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600 group-hover:animate-pulse-glow group-hover:scale-110 transition-all duration-300" />
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="morph-card interactive-element animate-fade-in-up opacity-0 group p-6" style={{ '--i': '2', animationDelay: '0.3s', animationFillMode: 'forwards' } as any}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-green-600 transition-colors">
                  <TranslatedText text="Total Revenue" />
                </p>
                <p className="text-2xl font-bold text-gray-900 price-highlight group-hover:animate-bounce-gentle">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 group-hover:animate-bounce group-hover:scale-110 transition-all duration-300" />
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>

          <div className={`morph-card interactive-element animate-fade-in-up opacity-0 group p-6 ${stats.pendingOrders > 0 ? 'neon-glow animate-pulse-glow' : ''}`} style={{ '--i': '3', animationDelay: '0.4s', animationFillMode: 'forwards' } as any}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-red-600 transition-colors">
                  <TranslatedText text="Pending Orders" />
                </p>
                <p className="text-2xl font-bold text-gray-900 price-highlight group-hover:animate-heartbeat">{stats.pendingOrders}</p>
              </div>
              <Package className="w-8 h-8 text-red-600 group-hover:animate-shake group-hover:scale-110 transition-all duration-300" />
            </div>
            {stats.pendingOrders > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full animate-ping"></div>
            )}
          </div>
        </div>

        {/* Secondary Stats Cards - Artisan & Discount Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger-animation">
          <div className={`morph-card interactive-element animate-fade-in-up opacity-0 group p-6 ${stats.lowStockProducts > 0
              ? 'bg-amber-50 border-2 border-amber-200 animate-pulse-glow neon-glow'
              : 'glass-effect'
            }`} style={{ '--i': '0', animationDelay: '0.5s', animationFillMode: 'forwards' } as any}><div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  <TranslatedText text="Low Stock Alert" />
                </p>
                <p className={`text-2xl font-bold ${stats.lowStockProducts > 0 ? 'text-amber-600' : 'text-gray-900'
                  }`}>
                  {stats.lowStockProducts}
                </p>
              </div>
              <Package className={`w-8 h-8 ${stats.lowStockProducts > 0 ? 'text-amber-600' : 'text-gray-400'
                }`} />
            </div>
            {stats.lowStockProducts > 0 && (
              <p className="text-xs text-amber-600 mt-2">
                <TranslatedText text="Products with ≤5 items in stock" />
              </p>
            )}
          </div>          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  ⭐ <TranslatedText text="Featured Products" />
                </p>
                <p className="text-2xl font-bold text-purple-700">{stats.featuredProducts}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">
                  🎯 <TranslatedText text="Active Discounts" />
                </p>
                <p className="text-2xl font-bold text-green-700">{stats.activeDiscounts}</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  💰 <TranslatedText text="Total Savings Offered" />
                </p>
                <p className="text-2xl font-bold text-blue-700">₹{stats.discountSavings.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Shipping Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 stagger-animation">
          <div className={`morph-card interactive-element animate-fade-in-up opacity-0 group p-6 ${stats.ordersToShipToday > 0
              ? 'bg-red-50 border-2 border-red-200 animate-pulse-glow neon-glow'
              : 'glass-effect'
            }`} style={{ '--i': '0', animationDelay: '0.6s', animationFillMode: 'forwards' } as any}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  📦 <TranslatedText text="Orders to Ship Today" />
                </p>
                <p className={`text-2xl font-bold ${stats.ordersToShipToday > 0 ? 'text-red-600 animate-pulse' : 'text-gray-900'
                  }`}>
                  {stats.ordersToShipToday}
                </p>
              </div>
              <Truck className={`w-8 h-8 ${stats.ordersToShipToday > 0 ? 'text-red-600 animate-bounce' : 'text-gray-400'
                }`} />
            </div>
            {stats.ordersToShipToday > 0 && (
              <>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full animate-ping"></div>
                <p className="text-xs text-red-600 mt-2 font-semibold">
                  ⚠️ <TranslatedText text="Action required! These orders need to be shipped today." />
                </p>
              </>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">
                  🚚 <TranslatedText text="Shipped Orders" />
                </p>
                <p className="text-2xl font-bold text-indigo-700">{stats.shippedOrders}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-xs text-indigo-600 mt-2">
              <TranslatedText text="Successfully shipped or delivered" />
            </p>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-600">
                  ⏱️ <TranslatedText text="Pending Shipments" />
                </p>
                <p className="text-2xl font-bold text-teal-700">
                  {stats.totalOrders - stats.shippedOrders - orders.filter((o: Order) => o.status === 'CANCELLED').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-teal-600" />
            </div>
            <p className="text-xs text-teal-600 mt-2">
              <TranslatedText text="Orders awaiting shipment" />
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-effect morph-card mb-8 animate-slide-up">          <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 font-medium interactive-element relative group transition-all duration-300 ${activeTab === 'overview'
                ? 'border-b-2 border-orange-500 text-orange-600 animate-bounce-gentle'
                : 'text-gray-500 hover:text-gray-700 hover:bg-orange-50'
              }`}
          >
            <TranslatedText text="Overview" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-4 font-medium interactive-element relative group transition-all duration-300 ${activeTab === 'products'
                ? 'border-b-2 border-orange-500 text-orange-600 animate-bounce-gentle'
                : 'text-gray-500 hover:text-gray-700 hover:bg-orange-50'
              }`}
          >
            <Package className="w-4 h-4 inline mr-1 group-hover:animate-wiggle transition-transform" />
            <TranslatedText text="Products" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>            <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-4 font-medium interactive-element relative group transition-all duration-300 ${activeTab === 'orders'
                ? 'border-b-2 border-orange-500 text-orange-600 animate-bounce-gentle'
                : 'text-gray-500 hover:text-gray-700 hover:bg-orange-50'
              }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1 group-hover:animate-bounce-gentle transition-transform" />
            <TranslatedText text="Orders" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-6 py-4 font-medium interactive-element relative group transition-all duration-300 ${activeTab === 'offers'
                ? 'border-b-2 border-orange-500 text-orange-600 animate-bounce-gentle neon-glow'
                : 'text-gray-500 hover:text-gray-700 hover:bg-green-50'
              }`}
          >
            <TrendingDown className="w-4 h-4 inline mr-1 group-hover:animate-wiggle transition-transform" />
            <TranslatedText text="Offers" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-ping group-hover:animate-pulse"></div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-6 py-4 font-medium interactive-element relative group transition-all duration-300 ${activeTab === 'delivery'
                ? 'border-b-2 border-orange-500 text-orange-600 animate-bounce-gentle'
                : 'text-gray-500 hover:text-gray-700 hover:bg-blue-50'
              }`}
          >
            <Truck className="w-4 h-4 inline mr-1 group-hover:animate-bounce transition-transform" />
            <TranslatedText text="Delivery Routes" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>
        </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    <TranslatedText text="Recent Orders" />
                  </h3>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">
                            <TranslatedText text="Order" /> #{order.id.slice(-8)}
                          </p>
                          <p className="text-sm text-gray-600">{order.buyer.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-orange-600">₹{order.totalAmount.toLocaleString()}</p>
                          <p className={`text-sm ${order.status === 'PENDING' ? 'text-yellow-600' :
                              order.status === 'CONFIRMED' ? 'text-blue-600' :
                                order.status === 'DELIVERED' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            <TranslatedText text={order.status} />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    <TranslatedText text="Top Products" />
                  </h3>
                  <div className="space-y-3">
                    {products.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{product.title}</p>
                          <p className="text-sm text-gray-600">₹{product.price.toLocaleString()}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${product.inStock
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          <TranslatedText text={product.inStock ? 'In Stock' : 'Out of Stock'} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </div>
            )}

            {activeTab === 'products' && (<div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  <TranslatedText text="Your Products" />
                </h3>
                <Link
                  href="/seller/products/new"
                  className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    <TranslatedText text="Add Product" />
                  </span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-gray-50 rounded-xl p-4">                      <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 rounded-lg mb-4 overflow-hidden relative">
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-orange-400" />
                      </div>
                    )}

                    {/* Discount & Featured Badges */}
                    <div className="absolute top-2 left-2 space-y-1">                          {product.isFeatured && (
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                        ⭐ <TranslatedText text="Featured" />
                      </div>
                    )}
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded text-xs font-bold">
                          {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                        </div>
                      )}
                    </div>
                  </div>

                    <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.title}</h4>

                    {/* Enhanced Price Display */}
                    <div className="mb-3">
                      {product.originalPrice && product.originalPrice > product.price ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-orange-600 font-bold">₹{product.price.toLocaleString()}</span>
                            <span className="text-sm text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
                          </div>                            <div className="text-xs text-green-600 font-semibold">
                            <TranslatedText text="Saving" /> ₹{(product.originalPrice - product.price).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <p className="text-orange-600 font-bold">₹{product.price.toLocaleString()}</p>
                      )}
                    </div>

                    {/* Artisan Info */}
                    {(product.artForm || product.material || product.technique) && (
                      <div className="mb-3 space-y-1">
                        {product.artForm && (
                          <div className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full w-fit">
                            🎨 {product.artForm}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {product.material && (
                            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                              🌿 {product.material}
                            </span>
                          )}
                          {product.technique && (
                            <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                              ⚒️ {product.technique}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stock Quantity */}                      <div className="mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          <TranslatedText text="Stock Quantity" />:
                        </span>
                        <span className={`font-medium ${product.stockQuantity <= 5
                            ? product.stockQuantity === 0
                              ? 'text-red-600'
                              : 'text-amber-600'
                            : 'text-green-600'
                          }`}>
                          {product.stockQuantity} <TranslatedText text="units" />
                        </span>
                      </div>
                      {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ <TranslatedText text="Low stock!" />
                        </p>
                      )}
                      {product.stockQuantity === 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          ❌ <TranslatedText text="Out of stock!" />
                        </p>
                      )}
                    </div>                      <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">
                        <TranslatedText text="Stock Status" />
                      </span>
                      <button
                        onClick={() => toggleProductStock(product.id, product.inStock)}
                        className="flex items-center space-x-1"
                      >
                        {product.inStock ? (
                          <ToggleRight className="w-6 h-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                        <span className={`text-sm ${product.inStock ? 'text-green-600' : 'text-gray-400'}`}>
                          <TranslatedText text={product.inStock ? 'In Stock' : 'Out of Stock'} />
                        </span>
                      </button>
                    </div>                      <div className="flex space-x-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="flex-1 flex items-center justify-center space-x-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200"
                      >
                        <Eye className="w-4 h-4" />
                        <span>
                          <TranslatedText text="View" />
                        </span>
                      </Link>
                      <Link
                        href={`/seller/products/${product.id}/edit`}
                        className="flex-1 flex items-center justify-center space-x-1 bg-orange-100 text-orange-700 py-2 rounded-lg hover:bg-orange-200"
                      >
                        <Edit className="w-4 h-4" />
                        <span>
                          <TranslatedText text="Edit" />
                        </span>
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="flex items-center justify-center bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}            {activeTab === 'orders' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-6">
                  <TranslatedText text="Your Orders" />
                </h3>

                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            <TranslatedText text="Order" /> #{order.id.slice(-8)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-lg font-bold text-orange-600">
                            ₹{order.totalAmount.toLocaleString()}
                          </span>                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="PENDING">{translatedOptions.pending}</option>
                            <option value="CONFIRMED">{translatedOptions.confirmed}</option>
                            <option value="DELIVERED">{translatedOptions.delivered}</option>
                            <option value="CANCELLED">{translatedOptions.cancelled}</option>
                          </select>
                        </div>
                      </div>                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">
                            <TranslatedText text="Customer Details" />
                          </h5>
                          <p className="text-sm text-gray-600">
                            <TranslatedText text="Name" />: {order.buyer.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            <TranslatedText text="Email" />: {order.buyer.email}
                          </p>
                          {order.buyer.phone && (
                            <p className="text-sm text-gray-600">
                              <TranslatedText text="Phone" />: {order.buyer.phone}
                            </p>
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">
                            <TranslatedText text="Delivery Address" />
                          </h5>
                          <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                          {order.deliveryPincode && (
                            <p className="text-sm text-gray-600 mt-1">
                              📍 <TranslatedText text="Pincode" />: {order.deliveryPincode}
                            </p>
                          )}
                          {order.deliveryCity && order.deliveryState && (
                            <p className="text-sm text-gray-600">
                              {order.deliveryCity}, {order.deliveryState}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Shipping Information */}
                      {(order.courierName || order.estimatedDeliveryDate) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                            <Truck className="w-4 h-4 mr-2" />
                            <TranslatedText text="Shipping Information" />
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {order.courierName && (
                              <div className="flex items-center text-sm">
                                <Package className="w-4 h-4 text-blue-600 mr-2" />
                                <span className="text-gray-600">
                                  <TranslatedText text="Courier" />:
                                </span>
                                <span className="ml-1 font-medium text-blue-700">
                                  {order.courierName}
                                </span>
                              </div>
                            )}
                            {order.estimatedDeliveryDate && (
                              <div className="flex items-center text-sm">
                                <Clock className="w-4 h-4 text-blue-600 mr-2" />
                                <span className="text-gray-600">
                                  <TranslatedText text="Est. Delivery" />:
                                </span>
                                <span className="ml-1 font-medium text-blue-700">
                                  {new Date(order.estimatedDeliveryDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">
                          <TranslatedText text="Order Items" />
                        </h5>
                        <div className="space-y-2">
                          {order.orderItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <span>{item.product.title} x {item.quantity}</span>
                              <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}                </div>
              </div>
            )}

            {activeTab === 'offers' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <TrendingDown className="w-5 h-5 mr-2 text-green-600" />
                      <TranslatedText text="Bargaining Offers" />
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      <TranslatedText text="Manage price negotiations from buyers" />
                    </p>
                  </div>
                  <button
                    onClick={() => setShowOffersModal(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 flex items-center space-x-2"
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span><TranslatedText text="View All Offers" /></span>
                  </button>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 text-center border border-green-200">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingDown className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">
                    <TranslatedText text="Digital Bargaining Hub" />
                  </h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    <TranslatedText text="Experience the traditional art of bargaining in a modern digital format. Buyers can make offers on your products, and you can accept or reject them instantly." />
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white rounded-xl p-4">
                      <div className="text-2xl mb-2">💰</div>
                      <div className="font-medium text-gray-800 mb-1">
                        <TranslatedText text="Flexible Pricing" />
                      </div>
                      <div className="text-gray-600">
                        <TranslatedText text="Accept offers within your comfort range" />
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <div className="text-2xl mb-2">⚡</div>
                      <div className="font-medium text-gray-800 mb-1">
                        <TranslatedText text="Instant Decisions" />
                      </div>
                      <div className="text-gray-600">
                        <TranslatedText text="Respond to offers in real-time" />
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4">
                      <div className="text-2xl mb-2">🎯</div>
                      <div className="font-medium text-gray-800 mb-1">
                        <TranslatedText text="Higher Conversions" />
                      </div>
                      <div className="text-gray-600">
                        <TranslatedText text="Increase sales with negotiation" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOffersModal(true)}
                    className="mt-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 inline-flex items-center space-x-2"
                  >
                    <TrendingDown className="w-5 h-5" />
                    <span><TranslatedText text="Manage Offers" /></span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    <Truck className="w-5 h-5 inline mr-2" />
                    <TranslatedText text="Delivery Routes & Management" />
                  </h3>
                  <div className="text-sm text-gray-600">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    <TranslatedText text="Real-time delivery tracking" />
                  </div>
                </div>

                {user?.latitude && user?.longitude ? (
                  <DeliveryMap
                    orders={orders}
                    sellerLatitude={user.latitude}
                    sellerLongitude={user.longitude}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <MapPin className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      <TranslatedText text="Location Required" />
                    </h3>
                    <p className="text-yellow-700 mb-4">
                      <TranslatedText text="Please update your location in your profile to view delivery routes" />
                    </p>
                    <Link
                      href="/profile"
                      className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                    >
                      <TranslatedText text="Update Location" />
                    </Link>
                  </div>
                )}

                {/* Delivery Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-orange-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700">
                          <TranslatedText text="Pending Deliveries" />
                        </p>
                        <p className="text-2xl font-bold text-orange-800">
                          {orders.filter(o => o.status === 'PENDING').length}
                        </p>
                      </div>
                      <Package className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">
                          <TranslatedText text="Confirmed Deliveries" />
                        </p>
                        <p className="text-2xl font-bold text-blue-800">
                          {orders.filter(o => o.status === 'CONFIRMED').length}
                        </p>
                      </div>
                      <Truck className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">
                          <TranslatedText text="Completed Deliveries" />
                        </p>
                        <p className="text-2xl font-bold text-green-800">
                          {orders.filter(o => o.status === 'DELIVERED').length}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    <TranslatedText text="Quick Actions" />
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                    >
                      <Package className="w-4 h-4 inline mr-1" />
                      <TranslatedText text="Manage Orders" />
                    </button>
                    <button
                      onClick={() => {
                        const pendingOrders = orders.filter(o => o.status === 'PENDING')
                        if (pendingOrders.length > 0) {
                          // Auto-confirm all pending orders
                          pendingOrders.forEach(order => {
                            updateOrderStatus(order.id, 'CONFIRMED')
                          })
                        }
                      }}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Truck className="w-4 h-4 inline mr-1" />
                      <TranslatedText text="Confirm All Pending" />
                    </button>
                  </div>
                </div>
              </div>
            )}          </div>
        </div>

        {/* Offers Management Modal */}
        <OffersManagement
          isOpen={showOffersModal}
          onClose={() => setShowOffersModal(false)}
        />
      </div>
    </div>
  )
}
