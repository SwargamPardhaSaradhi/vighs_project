import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Calendar, CheckCircle, Clock, Wheat, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface Schedule {
  id: number
  farmer_id: number
  pesticide_name: string
  scheduled_date: string
  completed: boolean
}

interface CropFilter {
  id: number
  plant_name: string
}

export const Schedules: React.FC = () => {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [crops, setCrops] = useState<CropFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [selectedCrop, setSelectedCrop] = useState<string>('all')

  useEffect(() => {
    if (user) {
      fetchSchedules()
      fetchCrops()
    }
  }, [user])

  const fetchSchedules = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('treatment_schedules')
        .select('*')
        .eq('farmer_id', user.id)
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      setSchedules(data || [])
    } catch (error) {
      console.error('Error fetching schedules:', error)
      toast.error('Error loading schedules')
    } finally {
      setLoading(false)
    }
  }

  const fetchCrops = async () => {
    if (!user) return

    try {
      const { data: lands } = await supabase
        .from('lands')
        .select('id')
        .eq('farmer_id', user.id)

      if (lands && lands.length > 0) {
        const { data: plantsData } = await supabase
          .from('plants')
          .select('id, plant_name')
          .in('land_id', lands.map(l => l.id))

        setCrops(plantsData || [])
      }
    } catch (error) {
      console.error('Error fetching crops:', error)
    }
  }

  const toggleScheduleCompletion = async (scheduleId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('treatment_schedules')
        .update({ completed: !currentStatus })
        .eq('id', scheduleId)

      if (error) throw error

      // If marking as completed, update disease percentage in plants
      if (!currentStatus) {
        // Get all lands for this farmer
        const { data: lands } = await supabase
          .from('lands')
          .select('id')
          .eq('farmer_id', user?.id)

        if (lands && lands.length > 0) {
          // Get all plants for these lands
          const { data: plants } = await supabase
            .from('plants')
            .select('*')
            .in('land_id', lands.map(l => l.id))

          // Update disease percentage for each plant (reduce by 15% per treatment)
          if (plants && plants.length > 0) {
            const updatePromises = plants.map(plant => {
              const newDiseasePercentage = Math.max(0, plant.disease_percentage - 15)
              return supabase
                .from('plants')
                .update({ disease_percentage: newDiseasePercentage })
                .eq('id', plant.id)
            })
            
            await Promise.all(updatePromises)
          }
        }
      }

      setSchedules(schedules.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, completed: !currentStatus }
          : schedule
      ))

      toast.success(
        !currentStatus 
          ? 'Treatment completed! Disease levels have been reduced.' 
          : 'Treatment marked as pending'
      )
    } catch (error) {
      console.error('Error updating schedule:', error)
      toast.error('Error updating schedule')
    }
  }

  const filteredSchedules = schedules.filter(schedule => {
    const statusMatch = filter === 'all' || 
      (filter === 'pending' && !schedule.completed) ||
      (filter === 'completed' && schedule.completed)
    
    // For now, we'll show all schedules since we don't have direct crop-schedule relationship
    // In a real app, you'd want to link schedules to specific crops
    return statusMatch
  })

  const getStatusColor = (completed: boolean, date: string) => {
    if (completed) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
    
    const scheduleDate = new Date(date)
    const today = new Date()
    const isOverdue = scheduleDate < today

    if (isOverdue) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  }

  const getStatusText = (completed: boolean, date: string) => {
    if (completed) return 'Completed'
    
    const scheduleDate = new Date(date)
    const today = new Date()
    const isOverdue = scheduleDate < today

    return isOverdue ? 'Overdue' : 'Pending'
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Treatment Schedules</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your crop treatment schedules</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by:</span>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Schedules</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {filteredSchedules.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No schedules found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all' 
              ? 'No treatment schedules available. Complete a crop diagnosis to generate schedules.'
              : `No ${filter} schedules found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {schedule.pesticide_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Scheduled for {new Date(schedule.scheduled_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.completed, schedule.scheduled_date)}`}>
                    {getStatusText(schedule.completed, schedule.scheduled_date)}
                  </span>
                  
                  <button
                    onClick={() => toggleScheduleCompletion(schedule.id, schedule.completed)}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      schedule.completed
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {schedule.completed ? (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Mark Pending
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Treatment Progress</span>
                  <span>{schedule.completed ? '100%' : '0%'}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      schedule.completed ? 'bg-green-600 w-full' : 'bg-gray-300 dark:bg-gray-600 w-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {schedules.length}
              </p>
              <p className="text-gray-600 dark:text-gray-400">Total Schedules</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {schedules.filter(s => !s.completed).length}
              </p>
              <p className="text-gray-600 dark:text-gray-400">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {schedules.filter(s => s.completed).length}
              </p>
              <p className="text-gray-600 dark:text-gray-400">Completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}