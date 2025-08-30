import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { Upload, Wheat, Zap, Leaf, MapPin, TrendingUp, Calendar, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const CROPS = [
  { name: 'Corn', icon: Wheat, color: 'bg-yellow-500' },
  { name: 'Rice', icon: Leaf, color: 'bg-green-500' },
  { name: 'Wheat', icon: Zap, color: 'bg-orange-500' }
]

interface DiagnosisResult {
  status: string
  predicted_class: string
  confidence: number
}

interface RecommendationResult {
  status: string
  pesticides: string[]
  treatment_schedules: Array<{
    pesticide_name: string
    scheduled_date: string
    completed: boolean
  }>
}

export const CropDiagnosis: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState(1)
  const [selectedCrop, setSelectedCrop] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null)
  
  // Check if we're in edit mode
  const editMode = location.state?.editMode || false
  const existingLandId = location.state?.landId
  const existingLandInfo = location.state?.landInfo

  React.useEffect(() => {
    if (editMode && existingLandInfo) {
      // Pre-fill form with existing land data when in edit mode
      setStep(1)
    }
  }, [editMode, existingLandInfo])

  const { register, handleSubmit, formState: { errors } } = useForm()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB')
        return
      }
      
      setImageFile(file)
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      
      toast.success('Image selected successfully!')
    }
  }

  const analyzePlant = async () => {
    if (!imageFile) {
      toast.error('Please select an image first')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch('https://model-api-check.onrender.com/predict', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      
      if (data.status !== 'success') {
        throw new Error('Plant analysis failed')
      }
      
      setDiagnosisResult(data)

      // Store diagnosis in database
      await supabase
        .from('plant_diagnosis')
        .insert([{
          farmer_id: user?.id,
          status: data.status,
          predicted_class: data.predicted_class,
          confidence: data.confidence
        }])

      setStep(3)
      toast.success('Plant analysis completed!')
    } catch (error) {
      toast.error('Error analyzing plant. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitLandDetails = async (data: any) => {
    if (!diagnosisResult || !user) return

    setLoading(true)
    try {
      let landData
      
      if (editMode && existingLandId) {
        // Update existing land
        const { data: updatedLand, error: landError } = await supabase
          .from('lands')
          .update({
            acres: parseFloat(data.acres),
            location: data.location
          })
          .eq('id', existingLandId)
          .select()
          .single()

        if (landError) throw landError
        landData = updatedLand

        // Delete old plant data
        await supabase
          .from('plants')
          .delete()
          .eq('land_id', existingLandId)

        // Delete old treatment schedules
        await supabase
          .from('treatment_schedules')
          .delete()
          .eq('farmer_id', user.id)
      } else {
        // Create new land entry
        const { data: newLand, error: landError } = await supabase
          .from('lands')
          .insert([{
            farmer_id: user.id,
            acres: parseFloat(data.acres),
            location: data.location
          }])
          .select()
          .single()

        if (landError) throw landError
        landData = newLand
      }

      // Create plant entry
      await supabase
        .from('plants')
        .insert([{
          land_id: landData.id,
          plant_name: selectedCrop,
          disease_percentage: parseFloat(data.disease_percentage),
          previous_fertilizers: data.previous_fertilizers
        }])

      // Get pesticide recommendations
      const payload = {
        plant_name: selectedCrop,
        disease_percentage: parseFloat(data.disease_percentage),
        previous_fertilizers: data.previous_fertilizers,
        acres: parseFloat(data.acres),
        location: data.location,
        predicted_class: diagnosisResult.predicted_class
      }

      const recommendationResponse = await fetch('https://model-api-check-2.onrender.com/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const recommendationData = await recommendationResponse.json()
      setRecommendations(recommendationData)

      // Store treatment schedules
      if (recommendationData.treatment_schedules) {
        const { error: scheduleError } = await supabase
          .from('treatment_schedules')
          .insert(
            recommendationData.treatment_schedules.map((schedule: any) => ({
              farmer_id: user.id,
              pesticide_name: schedule.pesticide_name,
              scheduled_date: schedule.scheduled_date,
              completed: schedule.completed
            }))
          )

        if (scheduleError) throw scheduleError

                  // Send schedule email using the new email API
          try {
            const scheduleText = `
🌱 FARMCARE TREATMENT SCHEDULE 🌱
=====================================

Your personalized crop treatment plan has been generated based on AI-powered analysis.

📋 ANALYSIS SUMMARY
-------------------
Crop Type: ${selectedCrop}
Disease Detected: ${diagnosisResult.predicted_class.replace(/_/g, ' ')}
Disease Severity: ${data.disease_percentage}%
Location: ${data.location}
Land Area: ${data.acres} acres

                    
💊 RECOMMENDED PESTICIDES
-------------------------
${recommendationData.pesticides.map((pesticide: string, index: number) => `${index + 1}. ${pesticide}`).join('\n')}


📅 TREATMENT SCHEDULE
---------------------
${recommendationData.treatment_schedules.map((schedule: any, index: number) => `
${index + 1}. ${schedule.pesticide_name}
   📅 Date: ${new Date(schedule.scheduled_date).toLocaleDateString('en-US', { 
     weekday: 'long', 
     year: 'numeric', 
     month: 'long', 
     day: 'numeric' 
   })}
   Status: Scheduled
`).join('\n')}

⚠️ IMPORTANT NOTES
------------------
• Follow the exact treatment schedule for optimal results
• Wear protective equipment when applying pesticides
• Store pesticides in a cool, dry place away from children
• Monitor crop health after each treatment
• Keep records of all applications for future reference

📧 SCHEDULE REMINDERS
---------------------
This treatment schedule has been automatically generated based on your crop analysis. 
Please follow the recommended treatment plan for optimal results.

🌾 FARMCARE - PROFESSIONAL CROP MANAGEMENT
==========================================
Powered by AI-Powered Crop Analysis

For support or questions, please contact our team.
Generated on: ${new Date().toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
            `

            const emailPayload = {
              to: user.email,
              subject: `🌱 FarmCare Treatment Schedule - ${selectedCrop} Crop - ${diagnosisResult.predicted_class.replace(/_/g, ' ')}`,
              body: scheduleText
            }

            const emailResponse = await fetch("https://check-2-41fv.onrender.com/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(emailPayload)
            })

            if (emailResponse.ok) {
              toast.success('Treatment schedule has been sent to your email! 📧')
            } else {
              toast.error('Schedule generated but email delivery failed')
            }
          } catch (emailError) {
            toast.error('Schedule generated but email delivery failed')
          }
      }

      setStep(4)
      toast.success('Land details saved and recommendations generated!')
    } catch (error) {
      toast.error('Error saving data')
    } finally {
      setLoading(false)
    }
  }

  // Removed email sending after diagnosis as requested

  const goToDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        {editMode && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Edit Mode:</strong> Re-diagnosing crop for {existingLandInfo?.location} ({existingLandInfo?.acres} acres)
            </p>
          </div>
        )}
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= i ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {step > i ? <CheckCircle className="w-5 h-5" /> : i}
              </div>
              {i < 4 && (
                <div className={`flex-1 h-1 mx-4 ${
                  step > i ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Select Crop</span>
          <span>Upload Image</span>
          <span>Land Details</span>
          <span>Results</span>
        </div>
      </div>

      {/* Step 1: Crop Selection */}
      {step === 1 && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {editMode ? 'Select New Crop Type' : 'Select Your Crop'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CROPS.map((crop) => (
              <button
                key={crop.name}
                onClick={() => {
                  setSelectedCrop(crop.name)
                  setStep(2)
                }}
                className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedCrop === crop.name
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                }`}
              >
                <div className={`w-16 h-16 ${crop.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <crop.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{crop.name}</h3>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Image Upload */}
      {step === 2 && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {editMode ? `Upload New ${selectedCrop} Image for Re-analysis` : `Upload ${selectedCrop} Image for Analysis`}
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="mb-4">
              <label htmlFor="image-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  Click to upload image
                </span>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                PNG, JPG up to 10MB
              </p>
            </div>
            
            {imagePreview && imageFile && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Selected"
                  className="max-w-xs max-h-64 mx-auto rounded-lg shadow-md"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {imageFile.name}
                </p>
                <button
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                    const input = document.getElementById('image-upload') as HTMLInputElement
                    if (input) input.value = ''
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Back
            </button>
            <button
              onClick={analyzePlant}
              disabled={!imageFile || loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Analyze Plant'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Land Details Form */}
      {step === 3 && diagnosisResult && (
        <div className="space-y-6">
          {/* Diagnosis Results */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analysis Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Disease Detected</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {diagnosisResult.predicted_class.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {(diagnosisResult.confidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Land Details Form */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {editMode ? 'Update Land Details' : 'Land Details'}
            </h2>
            <form onSubmit={handleSubmit(submitLandDetails)} className="space-y-6">
              {editMode && existingLandInfo && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Details:</p>
                  <p className="text-sm"><strong>Location:</strong> {existingLandInfo.location}</p>
                  <p className="text-sm"><strong>Area:</strong> {existingLandInfo.acres} acres</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Acres
                  </label>
                  <input
                    {...register('acres', { 
                      required: 'Acres is required', 
                      min: { value: 0.1, message: 'Must be at least 0.1 acres' } 
                    })}
                    type="number"
                    step="0.1"
                    defaultValue={editMode ? existingLandInfo?.acres : ''}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 5.5"
                  />
                  {errors.acres && (
                    <p className="mt-1 text-sm text-red-600">{errors.acres.message?.toString()}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Disease Percentage
                  </label>
                  <input
                    {...register('disease_percentage', { 
                      required: 'Disease percentage is required',
                      min: { value: 0, message: 'Must be at least 0%' },
                      max: { value: 100, message: 'Must be at most 100%' }
                    })}
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 40"
                  />
                  {errors.disease_percentage && (
                    <p className="mt-1 text-sm text-red-600">{errors.disease_percentage.message?.toString()}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  {...register('location', { required: 'Location is required' })}
                  type="text"
                  defaultValue={editMode ? existingLandInfo?.location : ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Karnataka"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message?.toString()}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Previous Fertilizers
                </label>
                <textarea
                  {...register('previous_fertilizers')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Urea, DAP"
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Getting Recommendations...' : (editMode ? 'Update & Get New Recommendations' : 'Get Recommendations')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 4: Results and Recommendations */}
      {step === 4 && recommendations && (
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {editMode ? 'Re-analysis Complete!' : 'Analysis Complete!'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {editMode ? 'Your updated treatment plan has been generated.' : 'Your treatment plan has been generated.'}
            </p>
          </div>

          {/* Recommended Pesticides */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Leaf className="w-5 h-5 text-green-600 mr-2" />
              Recommended Pesticides
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.pesticides.map((pesticide, index) => (
                <div key={index} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">{pesticide}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Treatment Schedule */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              Treatment Schedule
            </h3>
            <div className="space-y-4">
              {recommendations.treatment_schedules.map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {schedule.pesticide_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(schedule.scheduled_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full">
                    Scheduled
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={goToDashboard}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}