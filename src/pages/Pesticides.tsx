import React, { useState } from 'react'
import { Pill, AlertTriangle, CheckCircle, Droplets, Clock, Wheat, Leaf, Zap } from 'lucide-react'

interface PesticideInfo {
  name: string
  category: string
  crops: string[]
  diseases: string[]
  dosage: string
  applicationMethod: string
  advantages: string[]
  sideEffects: string[]
  precautions: string[]
  activeIngredient: string
  reentryPeriod: string
  harvestInterval: string
}

const pesticidesData: PesticideInfo[] = [
  {
    name: "Azoxystrobin + Difenoconazole",
    category: "Fungicide",
    crops: ["Corn", "Rice", "Wheat"],
    diseases: ["Gray Leaf Spot", "Blast", "Rust", "Blight"],
    dosage: "200-250 ml per acre",
    applicationMethod: "Foliar spray",
    advantages: [
      "Broad spectrum disease control",
      "Systemic and contact action",
      "Long-lasting protection",
      "Improves plant health and yield"
    ],
    sideEffects: [
      "May cause skin irritation",
      "Harmful if inhaled",
      "Toxic to aquatic life",
      "May affect beneficial insects"
    ],
    precautions: [
      "Wear protective clothing",
      "Avoid spraying during windy conditions",
      "Do not contaminate water sources",
      "Store in cool, dry place"
    ],
    activeIngredient: "Azoxystrobin 11% + Difenoconazole 25%",
    reentryPeriod: "12 hours",
    harvestInterval: "21 days"
  },
  {
    name: "Mancozeb",
    category: "Fungicide",
    crops: ["Corn", "Rice", "Wheat"],
    diseases: ["Leaf Spot", "Blight", "Rust", "Downy Mildew"],
    dosage: "400-500 grams per acre",
    applicationMethod: "Foliar spray",
    advantages: [
      "Multi-site mode of action",
      "Low resistance development",
      "Cost-effective",
      "Compatible with other pesticides"
    ],
    sideEffects: [
      "May cause respiratory irritation",
      "Skin sensitization possible",
      "Harmful to aquatic organisms",
      "May affect thyroid function with prolonged exposure"
    ],
    precautions: [
      "Use respiratory protection",
      "Avoid contact with skin and eyes",
      "Do not spray near water bodies",
      "Follow pre-harvest interval strictly"
    ],
    activeIngredient: "Mancozeb 75%",
    reentryPeriod: "24 hours",
    harvestInterval: "15 days"
  },
  {
    name: "Propiconazole",
    category: "Fungicide",
    crops: ["Wheat", "Corn"],
    diseases: ["Rust", "Powdery Mildew", "Leaf Spot"],
    dosage: "100-150 ml per acre",
    applicationMethod: "Foliar spray",
    advantages: [
      "Systemic action",
      "Curative and preventive properties",
      "Long residual activity",
      "Effective against resistant strains"
    ],
    sideEffects: [
      "Potential endocrine disruptor",
      "May cause liver toxicity",
      "Harmful to bees",
      "Persistent in environment"
    ],
    precautions: [
      "Avoid application during flowering",
      "Use only recommended doses",
      "Maintain buffer zones near apiaries",
      "Proper disposal of containers"
    ],
    activeIngredient: "Propiconazole 25%",
    reentryPeriod: "12 hours",
    harvestInterval: "30 days"
  },
  {
    name: "Chlorpyrifos",
    category: "Insecticide",
    crops: ["Corn", "Rice"],
    diseases: ["Stem Borer", "Leaf Folder", "Aphids"],
    dosage: "400-500 ml per acre",
    applicationMethod: "Foliar spray / Soil application",
    advantages: [
      "Broad spectrum insect control",
      "Contact and stomach poison",
      "Good residual activity",
      "Cost-effective"
    ],
    sideEffects: [
      "Highly toxic to humans",
      "Neurotoxic effects",
      "Harmful to birds and fish",
      "May cause developmental issues"
    ],
    precautions: [
      "Use extreme caution",
      "Wear full protective equipment",
      "Avoid drift to non-target areas",
      "Restricted use pesticide"
    ],
    activeIngredient: "Chlorpyrifos 20%",
    reentryPeriod: "72 hours",
    harvestInterval: "21 days"
  },
  {
    name: "Imidacloprid",
    category: "Insecticide",
    crops: ["Rice", "Wheat", "Corn"],
    diseases: ["Aphids", "Thrips", "Whiteflies", "Planthoppers"],
    dosage: "40-60 ml per acre",
    applicationMethod: "Seed treatment / Foliar spray",
    advantages: [
      "Systemic action",
      "Long-lasting protection",
      "Low application rates",
      "Multiple application methods"
    ],
    sideEffects: [
      "Toxic to bees and pollinators",
      "May cause neurological effects",
      "Persistent in soil",
      "Potential groundwater contamination"
    ],
    precautions: [
      "Avoid application during bloom",
      "Protect pollinators",
      "Follow resistance management",
      "Proper timing of application"
    ],
    activeIngredient: "Imidacloprid 17.8%",
    reentryPeriod: "12 hours",
    harvestInterval: "21 days"
  }
]

export const Pesticides: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCrop, setSelectedCrop] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  const categories = ['all', 'Fungicide', 'Insecticide']
  const crops = ['all', 'Corn', 'Rice', 'Wheat']

  const filteredPesticides = pesticidesData.filter(pesticide => {
    const categoryMatch = selectedCategory === 'all' || pesticide.category === selectedCategory
    const cropMatch = selectedCrop === 'all' || pesticide.crops.includes(selectedCrop)
    const searchMatch = pesticide.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       pesticide.diseases.some(disease => disease.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return categoryMatch && cropMatch && searchMatch
  })

  const getCropIcon = (crop: string) => {
    switch (crop) {
      case 'Corn': return Wheat
      case 'Rice': return Leaf
      case 'Wheat': return Zap
      default: return Wheat
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pesticides Information</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive guide to pesticides for crop disease management
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search pesticides or diseases..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Crop
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {crops.map(crop => (
                <option key={crop} value={crop}>
                  {crop === 'all' ? 'All Crops' : crop}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSelectedCrop('all')
                setSearchTerm('')
              }}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPesticides.map((pesticide, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Pill className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {pesticide.name}
                  </h3>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                    {pesticide.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Crops and Diseases */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Effective Against
                </h4>
                <div className="flex flex-wrap gap-2">
                  {pesticide.diseases.map((disease, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full"
                    >
                      {disease}
                    </span>
                  ))}
                </div>
              </div>

              {/* Crops */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Suitable Crops
                </h4>
                <div className="flex flex-wrap gap-2">
                  {pesticide.crops.map((crop, idx) => {
                    const CropIcon = getCropIcon(crop)
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full"
                      >
                        <CropIcon className="w-3 h-3 mr-1" />
                        {crop}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Dosage and Application */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dosage
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{pesticide.dosage}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Application
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{pesticide.applicationMethod}</p>
                </div>
              </div>

              {/* Advantages */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                  Advantages
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {pesticide.advantages.slice(0, 3).map((advantage, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="w-1 h-1 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {advantage}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Side Effects */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 text-red-600 mr-1" />
                  Side Effects
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {pesticide.sideEffects.slice(0, 3).map((effect, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {effect}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Re-entry:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">{pesticide.reentryPeriod}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Harvest:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">{pesticide.harvestInterval}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPesticides.length === 0 && (
        <div className="text-center py-12">
          <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pesticides found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}
    </div>
  )
}