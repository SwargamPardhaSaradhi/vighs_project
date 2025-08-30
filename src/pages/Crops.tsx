import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Wheat, MapPin, AlertTriangle, Calendar, Trash2, Plus, Edit3, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface CropData {
  id: number
  land_id: number
  plant_name: string
  disease_percentage: number
  previous_fertilizers: string
  created_at: string
  land: {
    location: string
    acres: number
  }
  diagnosis?: {
    predicted_class: string
    confidence: number
  }
}

export const Crops: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [crops, setCrops] = useState<CropData[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCrop, setSelectedCrop] = useState<CropData | null>(null)

  useEffect(() => {
    if (user) {
      fetchCrops()
    }
  }, [user])

  const fetchCrops = async () => {
    if (!user) return

    try {
      // Get all lands for the farmer
      const { data: lands } = await supabase
        .from('lands')
        .select('id')
        .eq('farmer_id', user.id)

      if (!lands || lands.length === 0) {
        setLoading(false)
        return
      }

      // Get plants with land details
      const { data: plantsData } = await supabase
        .from('plants')
        .select(`
          *,
          land:lands(location, acres)
        `)
        .in('land_id', lands.map(l => l.id))

      // Get diagnosis data
      const { data: diagnosisData } = await supabase
        .from('plant_diagnosis')
        .select('*')
        .eq('farmer_id', user.id)

      // Combine data
      const cropsWithDiagnosis = plantsData?.map(plant => ({
        ...plant,
        diagnosis: diagnosisData?.find(d => d.predicted_class.toLowerCase().includes(plant.plant_name.toLowerCase()))
      })) || []

      setCrops(cropsWithDiagnosis)
    } catch (error) {
      console.error('Error fetching crops:', error)
      toast.error('Error loading crops data')
    } finally {
      setLoading(false)
    }
  }

  const deleteCrop = async (cropId: number) => {
    if (!confirm('Are you sure you want to delete this crop? This action cannot be undone.')) {
      return
    }

    try {
      // Get the crop to find its land_id
      const cropToDelete = crops.find(crop => crop.id === cropId)
      if (!cropToDelete) {
        toast.error('Crop not found')
        return
      }

      // Delete the crop
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', cropId)

      if (error) throw error

      // Delete the corresponding land
      const { error: landError } = await supabase
        .from('lands')
        .delete()
        .eq('id', cropToDelete.land_id)

      if (landError) throw landError

      // Delete related treatment schedules
      await supabase
        .from('treatment_schedules')
        .delete()
        .eq('farmer_id', user?.id || 0)

      setCrops(crops.filter(crop => crop.id !== cropId))
      toast.success('Crop and associated land deleted successfully')
    } catch (error) {
      console.error('Error deleting crop:', error)
      toast.error('Error deleting crop')
    }
  }

  const handleEditCrop = (crop: CropData) => {
    setSelectedCrop(crop)
    setShowEditModal(true)
  }

  const confirmRediagnosis = () => {
    if (selectedCrop) {
      // Navigate to crop diagnosis with land info
      navigate('/crop-diagnosis', { 
        state: { 
          editMode: true, 
          landId: selectedCrop.land_id,
          landInfo: selectedCrop.land 
        } 
      })
    }
    setShowEditModal(false)
  }

  const getCropIcon = (cropName: string) => {
    return Wheat // Using same icon for all crops for now
  }

  const getDiseaseColor = (percentage: number) => {
    if (percentage < 20) return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
    if (percentage < 50) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300'
    return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Crops</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your diagnosed crops and their conditions</p>
        </div>
        <button
          onClick={() => navigate('/crop-diagnosis')}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Crop
        </button>
      </div>

      {crops.length === 0 ? (
        <div className="text-center py-12">
          <Wheat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No crops found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start by diagnosing your first crop to see it here.
          </p>
          <button
            onClick={() => navigate('/crop-diagnosis')}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Diagnose First Crop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crops.map((crop) => {
            const CropIcon = getCropIcon(crop.plant_name)
            return (
              <div
                key={crop.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <CropIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {crop.plant_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(crop.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCrop(crop.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditCrop(crop)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit Crop"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{crop.land.location} • {crop.land.acres} acres</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Disease Level</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDiseaseColor(crop.disease_percentage)}`}>
                      {crop.disease_percentage}%
                    </span>
                  </div>

                  {crop.diagnosis && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Detected Disease
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {crop.diagnosis.predicted_class.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Confidence: {(crop.diagnosis.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {crop.previous_fertilizers && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Previous Fertilizers:
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {crop.previous_fertilizers}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => navigate('/schedules', { state: { cropId: crop.id } })}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View Treatment Schedule
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Crop Modal */}
      {showEditModal && selectedCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <RefreshCw className="w-5 h-5 mr-2 text-blue-600" />
              Re-diagnose Crop
            </h3>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Current Crop:</strong> {selectedCrop.plant_name}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Location:</strong> {selectedCrop.land.location}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Area:</strong> {selectedCrop.land.acres} acres
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This will replace the current crop with a new diagnosis. The old treatment schedule will be removed and a new one will be created.
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmRediagnosis}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Re-diagnose Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}