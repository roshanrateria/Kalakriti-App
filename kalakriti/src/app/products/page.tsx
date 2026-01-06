'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Search, Filter, Grid, List, MapPin, Heart, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/Toaster'
import { TranslatedText } from '@/components/TranslatedText'
import { TranslatedProductCard } from '@/components/TranslatedProductCard'
import { useTranslation } from '@/contexts/TranslationContext'

interface Product {
  id: string
  title: string
  description: string
  tagline?: string
  price: number
  images: string[]
  inStock: boolean
  stockQuantity?: number
  tags: string[]
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
  authenticityMark?: string
  giTag?: boolean
  giftWrapping?: boolean
  heritageYears?: number
  seller: {
    id: string
    name: string
    address?: string
    latitude?: number
    longitude?: number
  }
}

export default function ProductsPage() {  const { user, token } = useAuth()
  const { translate } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [wishlistItems, setWishlistItems] = useState<string[]>([])
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search products...')
  const [originPlaceholder, setOriginPlaceholder] = useState('Origin (e.g., Kashmir, Bihar) 📍')
  const [minPricePlaceholder, setMinPricePlaceholder] = useState('Min Price ₹')
  const [maxPricePlaceholder, setMaxPricePlaceholder] = useState('Max Price ₹')
  
  // Effect to translate placeholder text when language changes
  useEffect(() => {
    const updatePlaceholders = async () => {
      const [search, origin, minPrice, maxPrice] = await Promise.all([
        translate('Search products...'),
        translate('Origin (e.g., Kashmir, Bihar) 📍'),
        translate('Min Price ₹'),
        translate('Max Price ₹')
      ])
      setSearchPlaceholder(search)
      setOriginPlaceholder(origin)
      setMinPricePlaceholder(minPrice)
      setMaxPricePlaceholder(maxPrice)
    }
    updatePlaceholders()
  }, [translate])
  
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    inStock: true,
    // Artisan-specific filters
    material: '',
    technique: '',
    artForm: '',
    origin: '',
    festival: '',
    // Sorting options
    sortBy: 'newest' // newest, oldest, price-low, price-high, discount, featured
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })
  useEffect(() => {
    fetchProducts()
  }, [pagination.page, searchQuery, filters])

  useEffect(() => {
    if (user?.role === 'BUYER') {
      fetchWishlistItems()
    }
  }, [user])

  const fetchProducts = async () => {
    setLoading(true)
    try {      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock.toString(),
        // Artisan filters
        material: filters.material,
        technique: filters.technique,
        artForm: filters.artForm,
        origin: filters.origin,
        festival: filters.festival,
        // Sorting
        sortBy: filters.sortBy
      })

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setProducts(data.products)
        setPagination(prev => ({ ...prev, ...data.pagination }))
      }    } catch (error) {
      console.error('Error fetching products:', error)
      const translated = await translate('Failed to load products')
      toast.error(translated)
    } finally {
      setLoading(false)
    }
  }
  const addToCart = async (productId: string) => {
    if (!user || !token) {
      const translated = await translate('Please login to add items to cart')
      toast.error(translated)
      return
    }

    if (user.role === 'SELLER') {
      const translated = await translate('Sellers cannot add items to cart')
      toast.error(translated)
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: 1 })
      })

      if (response.ok) {
        const translated = await translate('Added to cart!')
        toast.success(translated)
      } else {
        const translated = await translate('Failed to add to cart')
        toast.error(translated)
      }
    } catch (error) {
      const translated = await translate('Error adding to cart')
      toast.error(translated)    }
  }

  // Fetch wishlist items
  const fetchWishlistItems = async () => {
    if (!user || user.role !== 'BUYER' || !token) return
    
    try {
      const response = await fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWishlistItems(data.wishlistItems.map((item: any) => item.product.id))
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    }
  }

  // Toggle wishlist
  const toggleWishlist = async (productId: string) => {
    if (!user || !token) {
      const translated = await translate('Please login to manage wishlist')
      toast.error(translated)
      return
    }

    if (user.role === 'SELLER') {
      const translated = await translate('Sellers cannot use wishlist')
      toast.error(translated)
      return
    }

    const isInWishlist = wishlistItems.includes(productId)

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist?productId=${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          setWishlistItems(prev => prev.filter(id => id !== productId))
          const translated = await translate('Removed from wishlist')
          toast.success(translated)
        } else {
          const translated = await translate('Failed to remove from wishlist')
          toast.error(translated)
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId })
        })

        if (response.ok) {
          setWishlistItems(prev => [...prev, productId])
          const translated = await translate('Added to wishlist')
          toast.success(translated)
        } else {
          const errorData = await response.json()
          const translated = await translate(errorData.error || 'Failed to add to wishlist')
          toast.error(translated)
        }
      }
    } catch (error) {
      const translated = await translate('Error updating wishlist')
      toast.error(translated)
    }
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchProducts()
  }

  // Helper function to check if discount is active
  const isDiscountActive = (product: Product) => {
    if (!product.discountStart || !product.discountEnd) return false
    const now = new Date()
    const start = new Date(product.discountStart)
    const end = new Date(product.discountEnd)
    return now >= start && now <= end
  }

  // Helper function to calculate discount percentage
  const getDiscountPercent = (product: Product) => {
    if (!product.originalPrice || !isDiscountActive(product)) return 0
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
  }

  // Helper function to check if image is AI-enhanced
  const isAIEnhanced = (imageUrl: string) => {
    return imageUrl.includes('AI Enhanced by Kalakriti') || imageUrl.startsWith('data:image')
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            <TranslatedText text="Artisan Marketplace" /> 🎨
          </h1>
          <p className="text-xl text-gray-600">
            <TranslatedText text="Discover authentic handcrafted treasures from skilled artisans across India" />
          </p>
          <div className="mt-4 flex justify-center">
            <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-sm border border-purple-200">
              ✨ <TranslatedText text="THIS IS SPECIALLY FOR ARTISANS - Crafted with 💝" /> ✨
            </span>
          </div>
        </div>

        {/* AI Enhanced Images Disclaimer */}
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <span className="text-2xl">✨</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-1 flex items-center gap-2">
                <TranslatedText text="AI-Enhanced Product Images" />
              </h3>
              <p className="text-sm text-purple-800">
                <TranslatedText text="Some products feature AI-enhanced images (marked with ✨ AI Enhanced watermark). While we strive for accuracy, actual products may differ slightly in dimensions, orientation, or background. The authentic handcrafted item remains unchanged." />
              </p>
            </div>
          </div>
        </div>

        {/* Featured Products Section */}
        {products.filter(p => p.isFeatured).length > 0 && (
          <div className="mb-8">            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">⭐</span>
              <TranslatedText text="Featured Artisan Treasures" />
              <span className="ml-2">⭐</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.filter(p => p.isFeatured).slice(0, 3).map((product) => (
                <div
                  key={`featured-${product.id}`}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all border-2 border-yellow-200"
                >                  <div className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100">
                    {product.images.length > 0 ? (
                      <>
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                        {/* AI Enhanced Badge */}
                        {isAIEnhanced(product.images[0]) && (
                          <div className="absolute bottom-2 left-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-lg">
                            <span>✨</span>
                            <span>AI Enhanced</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-16 h-16 text-orange-400" />
                      </div>
                    )}<div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      ⭐ <TranslatedText text="Featured" />
                    </div>
                    {isDiscountActive(product) && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                        {getDiscountPercent(product)}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-4">                    <Link
                      href={`/products/${product.id}`}
                      className="text-lg font-semibold text-gray-800 hover:text-orange-600 transition-colors line-clamp-2"
                    >
                      <TranslatedText text={product.title} />
                    </Link>
                    <div className="mt-2 flex flex-col">
                      {isDiscountActive(product) && product.originalPrice ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-orange-600">
                              ₹{product.price.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              ₹{product.originalPrice.toLocaleString()}
                            </span>
                          </div>                          <div className="text-sm text-green-600 font-semibold">
                            <TranslatedText text="Save" /> ₹{(product.originalPrice - product.price).toLocaleString()}!
                          </div>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-orange-600">
                          ₹{product.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/products/${product.id}`}                      className="mt-3 block bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all text-center"
                    >
                      <TranslatedText text="View Featured Product" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}        {/* Search and Filters */}
        <div className="glass-effect morph-card p-6 mb-8 animate-slide-up">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-orange-500 transition-colors group-focus-within:animate-wiggle" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 interactive-element hover:shadow-md transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all magnetic-btn ripple-effect"
              >
                <TranslatedText text="Search" />
              </button>
            </div>
          </form><div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">              {/* Art Form Filter */}
              <select
                value={filters.artForm}
                onChange={(e) => setFilters({ ...filters, artForm: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50 interactive-element hover:bg-purple-100 transition-all duration-300"
              >
                <option value=""><TranslatedText text="All Art Forms" asText /> 🎨</option>
                <option value="Madhubani"><TranslatedText text="Madhubani Painting" asText /></option>
                <option value="Warli"><TranslatedText text="Warli Tribal Art" asText /></option>
                <option value="Kalamkari"><TranslatedText text="Kalamkari" asText /></option>
                <option value="Tanjore"><TranslatedText text="Tanjore Painting" asText /></option>
                <option value="Pattachitra"><TranslatedText text="Pattachitra" asText /></option>
                <option value="Blue Pottery"><TranslatedText text="Blue Pottery" asText /></option>
                <option value="Pashmina"><TranslatedText text="Pashmina Weaving" asText /></option>
                <option value="Ikat"><TranslatedText text="Ikat Weaving" asText /></option>
                <option value="Bandhani"><TranslatedText text="Bandhani Tie-Dye" asText /></option>
                <option value="Chikankari"><TranslatedText text="Chikankari Embroidery" asText /></option>
                <option value="Kantha"><TranslatedText text="Kantha Stitching" asText /></option>
                <option value="Dokra"><TranslatedText text="Dokra Metal Craft" asText /></option>
                <option value="Channapatna"><TranslatedText text="Channapatna Toys" asText /></option>
                <option value="Kondapalli"><TranslatedText text="Kondapalli Toys" asText /></option>
              </select>

              {/* Material Filter */}              <select
                value={filters.material}
                onChange={(e) => setFilters({ ...filters, material: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
              >
                <option value=""><TranslatedText text="All Materials" asText /> 🌿</option>
                <option value="Wood"><TranslatedText text="Wood" asText /></option>
                <option value="Clay"><TranslatedText text="Clay & Terracotta" asText /></option>
                <option value="Silk"><TranslatedText text="Pure Silk" asText /></option>
                <option value="Cotton"><TranslatedText text="Organic Cotton" asText /></option>
                <option value="Metal"><TranslatedText text="Metal (Brass, Copper, Silver)" asText /></option>
                <option value="Stone"><TranslatedText text="Natural Stone" asText /></option>
                <option value="Bamboo"><TranslatedText text="Bamboo" asText /></option>
                <option value="Paper"><TranslatedText text="Handmade Paper" asText /></option>
                <option value="Leather"><TranslatedText text="Genuine Leather" asText /></option>
                <option value="Glass"><TranslatedText text="Hand-blown Glass" asText /></option>
                <option value="Jute"><TranslatedText text="Natural Jute" asText /></option>
                <option value="Wool"><TranslatedText text="Pure Wool" asText /></option>
              </select>

              {/* Technique Filter */}              <select
                value={filters.technique}
                onChange={(e) => setFilters({ ...filters, technique: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
              >
                <option value=""><TranslatedText text="All Techniques" asText /> ⚒️</option>
                <option value="Hand-carved"><TranslatedText text="Hand-carved" asText /></option>
                <option value="Hand-woven"><TranslatedText text="Hand-woven" asText /></option>
                <option value="Hand-painted"><TranslatedText text="Hand-painted" asText /></option>
                <option value="Hand-embroidered"><TranslatedText text="Hand-embroidered" asText /></option>
                <option value="Wheel-thrown"><TranslatedText text="Wheel-thrown Pottery" asText /></option>
                <option value="Block-printed"><TranslatedText text="Block-printed" asText /></option>
                <option value="Hand-knotted"><TranslatedText text="Hand-knotted" asText /></option>
                <option value="Molded"><TranslatedText text="Hand-molded" asText /></option>
                <option value="Etched"><TranslatedText text="Hand-etched" asText /></option>
                <option value="Beaten"><TranslatedText text="Hand-beaten Metal" asText /></option>
                <option value="Inlay"><TranslatedText text="Inlay Work" asText /></option>
                <option value="Filigree"><TranslatedText text="Filigree Work" asText /></option>
              </select><input
                type="text"
                placeholder={originPlaceholder}
                value={filters.origin}
                onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 w-48"
              />

              {/* Festival Filter */}
              <select
                value={filters.festival || ''}
                onChange={(e) => setFilters({ ...filters, festival: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-pink-50"
              >
                <option value=""><TranslatedText text="All Occasions" asText /> 🎊</option>
                <option value="Diwali"><TranslatedText text="Diwali" asText /></option>
                <option value="Rakhi"><TranslatedText text="Rakhi" asText /></option>
                <option value="Wedding"><TranslatedText text="Wedding" asText /></option>
                <option value="Holi"><TranslatedText text="Holi" asText /></option>
                <option value="Puja"><TranslatedText text="Puja" asText /></option>
                <option value="Home Decor"><TranslatedText text="Home Decor" asText /></option>
                <option value="Gift"><TranslatedText text="Gift" asText /></option>
                <option value="Christmas"><TranslatedText text="Christmas" asText /></option>
                <option value="Eid"><TranslatedText text="Eid" asText /></option>
                <option value="Onam"><TranslatedText text="Onam" asText /></option>
                <option value="Pongal"><TranslatedText text="Pongal" asText /></option>
                <option value="Durga Puja"><TranslatedText text="Durga Puja" asText /></option>
              </select>

              <input
                type="number"
                placeholder={minPricePlaceholder}
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-32"
              />

              <input
                type="number"
                placeholder={maxPricePlaceholder}
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-32"
              />

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700"><TranslatedText text="Available Only" /></span>
              </label>
            </div>            <div className="flex items-center space-x-4">
              {/* Sort By Dropdown */}              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600"><TranslatedText text="Sort by:" /></span>                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                >
                  <option value="newest"><TranslatedText text="Newest First" asText /></option>
                  <option value="featured"><TranslatedText text="Featured First" asText /></option>
                  <option value="discount"><TranslatedText text="Best Discounts" asText /></option>
                  <option value="price-low"><TranslatedText text="Price: Low to High" asText /></option>
                  <option value="price-high"><TranslatedText text="Price: High to Low" asText /></option>
                  <option value="oldest"><TranslatedText text="Oldest First" asText /></option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-400'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-400'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>        {/* Products Grid/List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6 animate-pulse-glow"></div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2 animate-fade-in">
              <TranslatedText text="Loading amazing products..." />
            </h3>
            <p className="text-gray-500 animate-pulse">
              <TranslatedText text="Discovering authentic handcrafted treasures for you ✨" />
            </p>
            
            {/* Enhanced Loading skeleton cards */}
            <div className={`grid gap-6 mt-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="bg-white rounded-2xl shadow-lg p-6 skeleton morph-card animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'forwards' }}
                >
                  <div className="skeleton h-48 rounded-xl mb-4 float-animation"></div>
                  <div className="space-y-3">
                    <div className="skeleton h-4 rounded animate-shimmer"></div>
                    <div className="skeleton h-4 rounded w-2/3 animate-shimmer" style={{ animationDelay: '0.2s' }}></div>
                    <div className="skeleton h-6 rounded w-1/3 animate-shimmer" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>            {products.map((product, index) => (
              <div
                key={product.id}
                className={`morph-card interactive-element glass-effect animate-fade-in-up opacity-0 group cursor-pointer ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
                style={{ 
                  animationDelay: `${index * 0.1}s`, 
                  animationFillMode: 'forwards',
                  '--stagger-delay': '0.1s',
                  '--i': index
                } as any}
              >                <div className={`relative bg-gradient-to-br from-orange-100 to-red-100 ${
                  viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-48'
                }`}>
                  {product.images.length > 0 ? (
                    <>
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* AI Enhanced Watermark Indicator */}
                      {(product.images[0].includes('AI Enhanced by Kalakriti') || product.images[0].startsWith('data:image')) && (
                        <div className="absolute bottom-2 left-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-lg">
                          <span>✨</span>
                          <span>AI Enhanced</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="w-16 h-16 text-orange-400" />
                    </div>
                  )}{/* Discount Badge with Enhanced Animation */}
                  {isDiscountActive(product) && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-bounce-gentle hover:animate-wiggle transform hover:scale-110 transition-transform magnetic-btn neon-glow">
                      <span className="animate-pulse">💥</span> {getDiscountPercent(product)}% OFF
                    </div>
                  )}                    {/* Featured Badge */}
                  {product.isFeatured && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-float gradient-shift neon-glow">
                      ⭐ <TranslatedText text="Featured" />
                    </div>
                  )}
                  
                  {/* Make Offer Hint - appears on hover */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse-glow">
                      💰 <TranslatedText text="Make Offer" />
                    </div>
                  </div>
                  
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold"><TranslatedText text="Out of Stock" /></span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      href={`/products/${product.id}`}                      className="text-lg font-semibold text-gray-800 hover:text-orange-600 transition-colors line-clamp-2"
                    >
                      <TranslatedText text={product.title} />
                    </Link>
                  </div>

                  {product.tagline && (
                    <p className="text-sm text-orange-600 mb-2"><TranslatedText text={product.tagline} /></p>
                  )}

                  {/* Artisan Details */}
                  {(product.artForm || product.material || product.technique || product.origin) && (
                    <div className="mb-3 space-y-1">                      {product.artForm && (
                        <div className="flex items-center text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full w-fit">
                          <span className="mr-1">🎨</span>
                          <span><TranslatedText text={product.artForm} /></span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {product.material && (
                          <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                            🌿 <TranslatedText text={product.material} />
                          </span>
                        )}
                        {product.technique && (
                          <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                            ⚒️ <TranslatedText text={product.technique} />
                          </span>
                        )}
                        {product.origin && (
                          <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            📍 <TranslatedText text={product.origin} />
                          </span>
                        )}
                        {product.authenticityMark && (
                          <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                            🛡️ <TranslatedText text="Certified" />
                          </span>
                        )}
                        {product.giTag && (
                          <span className="text-xs text-white bg-gradient-to-r from-green-500 to-emerald-500 px-2 py-1 rounded-full font-semibold shadow-sm">
                            🏅 GI Tag
                          </span>
                        )}
                        {product.giftWrapping && (
                          <span className="text-xs text-white bg-gradient-to-r from-pink-500 to-red-500 px-2 py-1 rounded-full font-semibold shadow-sm">
                            🎁 Gift Wrap
                          </span>
                        )}
                        {product.heritageYears && (
                          <span className="text-xs text-white bg-gradient-to-r from-purple-500 to-indigo-500 px-2 py-1 rounded-full font-semibold shadow-sm">
                            📜 {product.heritageYears}+ yrs
                          </span>
                        )}
                      </div>
                    </div>
                  )}                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    <TranslatedText text={product.description} />
                  </p>                  <div className="flex flex-wrap gap-1 mb-4">
                    {product.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                      >
                        <TranslatedText text={tag} />
                      </span>
                    ))}
                  </div><div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      {isDiscountActive(product) && product.originalPrice ? (
                        <div className="space-y-1">                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-orange-600 hover:scale-110 transition-transform duration-300 cursor-pointer group-hover:animate-bounce">
                              ₹{product.price.toLocaleString()}
                            </span>
                            <span className="text-lg text-gray-500 line-through opacity-70 hover:opacity-100 transition-opacity">
                              ₹{product.originalPrice.toLocaleString()}
                            </span>
                          </div>                          <div className="text-sm text-green-600 font-semibold flex items-center space-x-1 animate-pulse">
                            <span>💸</span>
                            <span><TranslatedText text="You save" /> ₹{(product.originalPrice - product.price).toLocaleString()}!</span>
                          </div>
                        </div>                      ) : (
                        <span className="text-2xl font-bold text-orange-600 hover:scale-110 transition-transform duration-300 cursor-pointer group-hover:animate-bounce price-highlight">
                          ₹{product.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{product.seller.name}</span>
                    </div>
                  </div>                  <div className="flex space-x-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="flex-1 glass-effect interactive-element magnetic-btn text-gray-700 px-4 py-2 rounded-lg hover:shadow-md transition-all text-center ripple-effect"
                    >
                      <TranslatedText text="View Details" />
                    </Link>
                    {user?.role === 'BUYER' && (
                      <>
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className={`p-2 rounded-lg transition-all elastic-scale ripple-effect ${
                            wishlistItems.includes(product.id)
                              ? 'bg-red-100 text-red-600 hover:bg-red-200 animate-heartbeat neon-glow'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:animate-pulse-glow'
                          }`}
                        >
                          <Heart className={`w-4 h-4 transition-all duration-300 ${
                            wishlistItems.includes(product.id) ? 'fill-current scale-110 animate-bounce' : 'hover:animate-wiggle'
                          }`} />
                        </button>
                        {product.inStock && (
                          <button
                            onClick={() => addToCart(product.id)}
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all magnetic-btn ripple-effect neon-glow"
                          >
                            <ShoppingCart className="w-4 h-4 hover:animate-wiggle transition-transform" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex space-x-2">              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TranslatedText text="Previous" />
              </button>
              
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                  className={`px-4 py-2 rounded-lg ${
                    pagination.page === i + 1
                      ? 'bg-orange-500 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TranslatedText text="Next" />
              </button>
            </div>
          </div>
        )}        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              <TranslatedText text="No products found" />
            </h3>
            <p className="text-gray-500">
              <TranslatedText text="Try adjusting your search or filters" />
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
