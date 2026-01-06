'use client'

import React, { useState } from 'react'
import { TranslatedText } from '@/components/TranslatedText'
import { BookOpen, MapPin, Palette, Sparkles, Search, X } from 'lucide-react'
import Link from 'next/link'

interface CraftInfo {
  id: string
  name: string
  description: string
  origin: string
  technique: string
  materials: string[]
  history: string
  famousArtisans: string[]
  priceRange: string
  image: string
}

const CRAFTS_ENCYCLOPEDIA: CraftInfo[] = [
  {
    id: 'madhubani',
    name: 'Madhubani Painting',
    description: 'Ancient folk art from Bihar featuring intricate geometric patterns and mythological themes',
    origin: 'Madhubani, Bihar',
    technique: 'Hand-painted using natural dyes and pigments on cloth or handmade paper',
    materials: ['Natural dyes', 'Handmade paper', 'Cotton cloth', 'Bamboo sticks'],
    history: '2500+ year old tradition dating back to Ramayana era',
    famousArtisans: ['Sita Devi', 'Ganga Devi', 'Mahasundari Devi'],
    priceRange: '₹500 - ₹50,000',
    image: '🎨'
  },
  {
    id: 'warli',
    name: 'Warli Tribal Art',
    description: 'Minimalist tribal art using basic geometric shapes depicting daily life',
    origin: 'Maharashtra',
    technique: 'White paint on red/brown background using rice paste',
    materials: ['Rice paste', 'Natural ochre', 'Gum', 'Twigs'],
    history: '3000+ year old Neolithic tradition',
    famousArtisans: ['Jivya Soma Mashe', 'Balu Mashe'],
    priceRange: '₹300 - ₹30,000',
    image: '🖼️'
  },
  {
    id: 'kalamkari',
    name: 'Kalamkari',
    description: 'Hand-painted or block-printed cotton textile art depicting mythology',
    origin: 'Andhra Pradesh & Telangana',
    technique: 'Natural dyes with bamboo/date palm pen or hand-carved blocks',
    materials: ['Cotton fabric', 'Natural dyes', 'Bamboo pen', 'Wooden blocks'],
    history: '3000+ year old tradition mentioned in ancient texts',
    famousArtisans: ['Niranjan Rajah', 'Jonnalagadda Lakshmi'],
    priceRange: '₹800 - ₹80,000',
    image: '🎭'
  },
  {
    id: 'pashmina',
    name: 'Pashmina Weaving',
    description: 'Luxurious hand-woven shawls from fine Cashmere wool',
    origin: 'Kashmir',
    technique: 'Hand-spun and hand-woven on traditional looms',
    materials: ['Pashmina wool', 'Silk threads', 'Natural dyes'],
    history: '500+ year tradition from Mughal era',
    famousArtisans: ['Master weavers of Kashmir Valley'],
    priceRange: '₹5,000 - ₹5,00,000',
    image: '🧣'
  },
  {
    id: 'blue-pottery',
    name: 'Blue Pottery',
    description: 'Distinctive turquoise-blue glazed pottery with Persian influence',
    origin: 'Jaipur, Rajasthan',
    technique: 'Hand-molded using quartz stone powder, no clay',
    materials: ['Quartz', 'Glass', 'Fuller\'s earth', 'Borax'],
    history: '400+ years, brought by Mughal artisans',
    famousArtisans: ['Kripal Singh Shekhawat'],
    priceRange: '₹200 - ₹25,000',
    image: '🏺'
  },
  {
    id: 'chikankari',
    name: 'Chikankari Embroidery',
    description: 'Delicate white-on-white embroidery on fine muslin',
    origin: 'Lucknow, Uttar Pradesh',
    technique: 'Hand-embroidered with 32+ different stitches',
    materials: ['Muslin', 'Cotton', 'Silk threads', 'Georgette'],
    history: '400+ years from Mughal period',
    famousArtisans: ['Traditional Lucknow karigars'],
    priceRange: '₹1,000 - ₹1,00,000',
    image: '🪡'
  },
  {
    id: 'dokra',
    name: 'Dokra Metal Craft',
    description: 'Ancient bell metal casting using lost-wax technique',
    origin: 'West Bengal, Odisha, Chhattisgarh',
    technique: 'Lost-wax casting method, each piece unique',
    materials: ['Brass', 'Bronze', 'Wax', 'Clay'],
    history: '4000+ year old tradition',
    famousArtisans: ['Tribal artisans of Bastar'],
    priceRange: '₹300 - ₹50,000',
    image: '🔔'
  },
  {
    id: 'ikat',
    name: 'Ikat Weaving',
    description: 'Resist-dye pattern created on yarns before weaving',
    origin: 'Odisha, Gujarat, Telangana',
    technique: 'Tie-dyeing threads then weaving to create patterns',
    materials: ['Silk', 'Cotton', 'Natural dyes'],
    history: '1000+ years of weaving tradition',
    famousArtisans: ['Pochampally weavers'],
    priceRange: '₹1,500 - ₹1,50,000',
    image: '🧵'
  },
  {
    id: 'tanjore',
    name: 'Tanjore Painting',
    description: 'Classical South Indian painting with gold foil and gems',
    origin: 'Thanjavur, Tamil Nadu',
    technique: 'Gold leaf work on wooden panels with gem embellishments',
    materials: ['Gold foil', 'Precious stones', 'Wood', 'Natural colors'],
    history: '400+ years from Maratha period',
    famousArtisans: ['Traditional Tanjore artists'],
    priceRange: '₹2,000 - ₹2,00,000',
    image: '✨'
  },
  {
    id: 'channapatna',
    name: 'Channapatna Toys',
    description: 'Colorful wooden toys made using traditional lacquer technique',
    origin: 'Channapatna, Karnataka',
    technique: 'Wood turning on lathe with natural lacquer coating',
    materials: ['Ivory wood', 'Natural lac dyes'],
    history: '200+ years, GI tagged craft',
    famousArtisans: ['Bavas Miyan legacy artisans'],
    priceRange: '₹50 - ₹5,000',
    image: '🪀'
  },
  {
    id: 'bandhani',
    name: 'Bandhani Tie-Dye',
    description: 'Traditional tie-dye technique creating intricate dot patterns',
    origin: 'Gujarat & Rajasthan',
    technique: 'Plucking fabric with fingernails and tying before dyeing',
    materials: ['Silk', 'Cotton', 'Natural dyes'],
    history: '5000+ years old, oldest tie-dye tradition',
    famousArtisans: ['Khatri community artisans'],
    priceRange: '₹500 - ₹75,000',
    image: '🎨'
  },
  {
    id: 'kantha',
    name: 'Kantha Stitching',
    description: 'Running stitch embroidery creating ripple effect',
    origin: 'West Bengal & Bangladesh',
    technique: 'Simple running stitch creating elaborate patterns',
    materials: ['Old saris', 'Cotton threads'],
    history: '500+ years of recycling tradition',
    famousArtisans: ['Rural women of Bengal'],
    priceRange: '₹400 - ₹40,000',
    image: '🧶'
  }
]

export default function CraftsEncyclopediaPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCraft, setSelectedCraft] = useState<CraftInfo | null>(null)

  const filteredCrafts = CRAFTS_ENCYCLOPEDIA.filter(craft =>
    craft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    craft.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    craft.technique.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-12 h-12 text-orange-600 mr-3" />
            <h1 className="text-5xl font-bold text-gray-900">
              <TranslatedText text="Craft Encyclopedia" />
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            <TranslatedText text="Explore the rich heritage of Indian traditional crafts. Learn about techniques, origins, and the artisans who keep these ancient traditions alive." />
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by craft name, origin, or technique..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:outline-none text-lg"
            />
          </div>
        </div>

        {/* Crafts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCrafts.map((craft) => (
            <div
              key={craft.id}
              onClick={() => setSelectedCraft(craft)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 overflow-hidden"
            >
              <div className="bg-gradient-to-br from-orange-100 to-red-100 p-8 flex items-center justify-center">
                <span className="text-6xl">{craft.image}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  <TranslatedText text={craft.name} />
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  <TranslatedText text={craft.origin} />
                </div>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  <TranslatedText text={craft.description} />
                </p>
                <button className="text-orange-600 font-semibold text-sm hover:text-orange-700 flex items-center">
                  <TranslatedText text="Learn More" />
                  <Sparkles className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No results */}
        {filteredCrafts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              <TranslatedText text="No crafts found matching your search" />
            </p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedCraft && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 p-6 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-6xl mr-4">{selectedCraft.image}</span>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">
                      <TranslatedText text={selectedCraft.name} />
                    </h2>
                    <div className="flex items-center text-white">
                      <MapPin className="w-4 h-4 mr-1" />
                      <TranslatedText text={selectedCraft.origin} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCraft(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8">
                {/* Description */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                    <Palette className="w-5 h-5 mr-2 text-orange-600" />
                    <TranslatedText text="About" />
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    <TranslatedText text={selectedCraft.description} />
                  </p>
                </div>

                {/* History */}
                <div className="bg-amber-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    📜 <TranslatedText text="Historical Heritage" />
                  </h3>
                  <p className="text-gray-700">
                    <TranslatedText text={selectedCraft.history} />
                  </p>
                </div>

                {/* Technique */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    ⚒️ <TranslatedText text="Crafting Technique" />
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    <TranslatedText text={selectedCraft.technique} />
                  </p>
                </div>

                {/* Materials */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    🌿 <TranslatedText text="Materials Used" />
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCraft.materials.map((material, idx) => (
                      <span
                        key={idx}
                        className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium"
                      >
                        <TranslatedText text={material} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Famous Artisans */}
                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    👨‍🎨 <TranslatedText text="Notable Artisans" />
                  </h3>
                  <ul className="space-y-2">
                    {selectedCraft.famousArtisans.map((artisan, idx) => (
                      <li key={idx} className="text-gray-700 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                        <TranslatedText text={artisan} />
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price Range */}
                <div className="bg-orange-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    💰 <TranslatedText text="Typical Price Range" />
                  </h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {selectedCraft.priceRange}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <TranslatedText text="Prices vary based on size, complexity, and artisan expertise" />
                  </p>
                </div>

                {/* CTA */}
                <div className="text-center pt-4">
                  <Link
                    href={`/products?artForm=${selectedCraft.id}`}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 font-semibold text-lg"
                  >
                    <TranslatedText text="Browse" /> {selectedCraft.name} <TranslatedText text="Products" />
                    <Sparkles className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
