'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useTranslation } from '@/contexts/TranslationContext'
import { TranslatedText } from '@/components/TranslatedText'
import { 
  Clock, 
  TrendingDown, 
  Check, 
  X, 
  MessageCircle,
  Package,
  Calendar,
  ExternalLink,
  ShoppingCart,
  Trash2,
  Tag,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/components/ui/Toaster'
import Link from 'next/link'

interface Offer {
  id: string
  offerPrice: number
  originalPrice: number
  status: string
  message?: string
  quantity: number
  expiresAt?: string
  createdAt: string
  updatedAt: string
  product: {
    id: string
    title: string
    price: number
    images: string[]
    inStock: boolean
  }
  seller: {
    id: string
    name: string
  }
}

interface MyOffersModalProps {
  isOpen: boolean
  onClose: () => void
  autoRefresh?: boolean
}

export default function MyOffersModal({ isOpen, onClose, autoRefresh = false }: MyOffersModalProps) {
  const { user, token } = useAuth()
  const { translate } = useTranslation()
  
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'expired'>('all')
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && user?.role === 'BUYER') {
      fetchOffers()
    }
  }, [isOpen, user, filter])

  useEffect(() => {
    if (autoRefresh && isOpen) {
      const interval = setInterval(() => {
        fetchOffers(true) // Silent refresh
      }, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, isOpen])

  const fetchOffers = async (silent = false) => {
    if (!token) return

    if (!silent) setLoading(true)
    try {
      const statusParam = filter === 'all' ? '' : `&status=${filter.toUpperCase()}`
      const response = await fetch(`/api/offers?type=made${statusParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const oldOffers = offers
        setOffers(data.offers)
        
        // Check for newly accepted/rejected offers to show notifications
        if (!silent && oldOffers.length > 0) {
          data.offers.forEach((newOffer: Offer) => {
            const oldOffer = oldOffers.find(o => o.id === newOffer.id)
            if (oldOffer && oldOffer.status === 'PENDING' && newOffer.status !== 'PENDING') {
              if (newOffer.status === 'ACCEPTED') {
                toast.success(`🎉 Your offer for "${newOffer.product.title}" was accepted!`)
              } else if (newOffer.status === 'REJECTED') {
                toast.info(`Your offer for "${newOffer.product.title}" was declined`)
              }
            }
          })
        }
      } else {
        if (!silent) toast.error(await translate('Failed to load offers'))
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
      if (!silent) toast.error(await translate('Failed to load offers'))
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const cancelOffer = async (offerId: string) => {
    if (!token || deletingOfferId) return

    setDeletingOfferId(offerId)
    
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(await translate('Offer cancelled successfully'))
        fetchOffers()
      } else {
        toast.error(await translate(data.error || 'Failed to cancel offer'))
      }
    } catch (error) {
      console.error('Error cancelling offer:', error)
      toast.error(await translate('Failed to cancel offer'))
    } finally {
      setDeletingOfferId(null)
    }
  }
  const addToCart = async (offer: Offer) => {
    if (!token) return

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          productId: offer.product.id, 
          quantity: offer.quantity,
          acceptedOfferId: offer.id,
          specialPrice: offer.offerPrice
        })
      })

      if (response.ok) {
        toast.success(await translate('Added to cart at your special price!'))
        // Close modal after adding to cart
        onClose()
      } else {
        toast.error(await translate('Failed to add to cart'))
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error(await translate('Failed to add to cart'))
    }
  }

  const getTimeLeft = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`
    }
    return `${minutes}m left`
  }

  const getDiscountPercent = (offer: Offer) => {
    return Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100)
  }

  const getSavings = (offer: Offer) => {
    return offer.originalPrice - offer.offerPrice
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'yellow'
      case 'ACCEPTED': return 'green'
      case 'REJECTED': return 'red'
      case 'EXPIRED': return 'gray'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-5 h-5" />
      case 'ACCEPTED': return <Check className="w-5 h-5" />
      case 'REJECTED': return <X className="w-5 h-5" />
      case 'EXPIRED': return <AlertCircle className="w-5 h-5" />
      default: return null
    }
  }
  if (!isOpen) return null

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === 'PENDING').length,
    accepted: offers.filter(o => o.status === 'ACCEPTED').length,
    rejected: offers.filter(o => o.status === 'REJECTED').length,
    expired: offers.filter(o => o.status === 'EXPIRED').length
  }
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[60] p-4 pt-20 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  <TranslatedText text="My Offers" />
                </h2>
                <p className="text-orange-100 text-sm">
                  <TranslatedText text="Track your bargain requests" />
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-5 gap-3 mt-6">
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-orange-100"><TranslatedText text="Total" /></div>
            </div>
            <div className="bg-yellow-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-xs text-orange-100"><TranslatedText text="Pending" /></div>
            </div>
            <div className="bg-green-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.accepted}</div>
              <div className="text-xs text-orange-100"><TranslatedText text="Accepted" /></div>
            </div>
            <div className="bg-red-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <div className="text-xs text-orange-100"><TranslatedText text="Declined" /></div>
            </div>
            <div className="bg-gray-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{stats.expired}</div>
              <div className="text-xs text-orange-100"><TranslatedText text="Expired" /></div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 mt-4 overflow-x-auto">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'accepted', label: 'Accepted' },
              { key: 'rejected', label: 'Declined' },
              { key: 'expired', label: 'Expired' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap ${
                  filter === tab.key
                    ? 'bg-white text-orange-600 font-semibold'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <TranslatedText text={tab.label} />
              </button>
            ))}
          </div>        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                <TranslatedText text="No offers found" />
              </h3>
              <p className="text-gray-500">
                <TranslatedText text="Start bargaining on products you like!" />
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => {
                const color = getStatusColor(offer.status)
                const isExpired = offer.expiresAt && new Date(offer.expiresAt) < new Date()
                
                return (
                  <div
                    key={offer.id}
                    className={`bg-gradient-to-r rounded-2xl p-6 border-2 transition-all ${
                      color === 'yellow'
                        ? 'from-yellow-50 to-orange-50 border-yellow-200 hover:border-yellow-300'
                        : color === 'green'
                        ? 'from-green-50 to-emerald-50 border-green-200'
                        : color === 'red'
                        ? 'from-red-50 to-pink-50 border-red-200'
                        : 'from-gray-50 to-gray-100 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <Link 
                        href={`/products/${offer.product.id}`}
                        className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-orange-500 transition-all"
                      >
                        {offer.product.images.length > 0 ? (
                          <img
                            src={offer.product.images[0]}
                            alt={offer.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </Link>

                      {/* Offer Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={`/products/${offer.product.id}`}
                              className="font-semibold text-gray-800 hover:text-orange-600 transition-colors line-clamp-1"
                            >
                              {offer.product.title}
                            </Link>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                              <span className="text-gray-500">Seller:</span>
                              <span className="font-medium">{offer.seller.name}</span>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${
                            color === 'yellow'
                              ? 'bg-yellow-100 text-yellow-800'
                              : color === 'green'
                              ? 'bg-green-100 text-green-800'
                              : color === 'red'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusIcon(offer.status)}
                            <span>{offer.status}</span>
                          </div>
                        </div>

                        {/* Price Comparison */}
                        <div className="bg-white rounded-xl p-4 mb-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-sm text-gray-600 mb-1">
                                <TranslatedText text="Original" />
                              </div>
                              <div className="text-lg font-bold text-gray-500 line-through">
                                ₹{offer.originalPrice.toLocaleString()}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm text-gray-600 mb-1">
                                <TranslatedText text="Your Offer" />
                              </div>
                              <div className="text-xl font-bold text-orange-600">
                                ₹{offer.offerPrice.toLocaleString()}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm text-gray-600 mb-1">
                                <TranslatedText text="Savings" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-lg font-bold text-green-600">
                                  {getDiscountPercent(offer)}%
                                </span>
                                <span className="text-sm text-green-600">
                                  ₹{getSavings(offer).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Message */}
                        {offer.message && (
                          <div className="bg-blue-50 rounded-xl p-3 mb-4">
                            <div className="flex items-start space-x-2">
                              <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-blue-800 mb-1">
                                  <TranslatedText text="Your message" />
                                </div>
                                <p className="text-sm text-blue-700">"{offer.message}"</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timing and Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(offer.createdAt).toLocaleDateString()}</span>
                            </div>
                            {offer.expiresAt && offer.status === 'PENDING' && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span className={
                                  isExpired
                                    ? 'text-red-600 font-semibold' 
                                    : 'text-orange-600'
                                }>
                                  {getTimeLeft(offer.expiresAt)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            {offer.status === 'ACCEPTED' && offer.product.inStock && (
                              <button
                                onClick={() => addToCart(offer)}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center space-x-2 shadow-md"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                <span><TranslatedText text="Add to Cart" /></span>
                              </button>
                            )}
                            
                            <Link
                              href={`/products/${offer.product.id}`}
                              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span><TranslatedText text="View" /></span>
                            </Link>

                            {offer.status === 'PENDING' && !isExpired && (
                              <button
                                onClick={() => cancelOffer(offer.id)}
                                disabled={deletingOfferId === offer.id}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center space-x-2"
                              >
                                {deletingOfferId === offer.id ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                                <span><TranslatedText text="Cancel" /></span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
