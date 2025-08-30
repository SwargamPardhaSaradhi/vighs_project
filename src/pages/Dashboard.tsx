import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Leaf, MapPin, Calendar, AlertTriangle, CheckCircle, Plus, Activity, Target } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalLands: 0,
    totalAcres: 0,
    activeTreatments: 0,
    completedTreatments: 0,
    averageDiseasePercentage: 0
  })
  const [lands, setLands] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [diagnoses, setDiagnoses] = useState<any[]>([])

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899']

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Fetch lands
      const { data: landsData } = await supabase
        .from('lands')
        .select('*')
        .eq('farmer_id', user.id)

      // Fetch plants for disease data
      const { data: plantsData } = await supabase
        .from('plants')
        .select('*')
        .in('land_id', landsData?.map(l => l.id) || [])

      // Fetch treatments
      const { data: treatmentsData } = await supabase
        .from('treatment_schedules')
        .select('*')
        .eq('farmer_id', user.id)
        .order('scheduled_date', { ascending: true })

      // Fetch diagnoses
      const { data: diagnosesData } = await supabase
        .from('plant_diagnosis')
        .select('*')
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false })

      setLands(landsData || [])
      setTreatments(treatmentsData || [])
      setDiagnoses(diagnosesData || [])

      // Calculate stats
      const totalAcres = landsData?.reduce((sum, land) => sum + land.acres, 0) || 0
      const activeTreatments = treatmentsData?.filter(t => !t.completed).length || 0
      const completedTreatments = treatmentsData?.filter(t => t.completed).length || 0
      
      // Calculate average disease percentage as simple mean of current plant values
      let avgDiseasePercentage = 0
      if (plantsData?.length) {
        const total = plantsData.reduce((sum, plant) => sum + (plant.disease_percentage || 0), 0)
        avgDiseasePercentage = total / plantsData.length
      }

      setStats({
        totalLands: landsData?.length || 0,
        totalAcres,
        activeTreatments,
        completedTreatments,
        averageDiseasePercentage: Math.round(avgDiseasePercentage)
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const landData = lands.map((land, index) => ({
    name: land.location.length > 10 ? land.location.substring(0, 10) + '...' : land.location,
    acres: land.acres,
    fullName: land.location
  }))

  const treatmentStatusData = [
    { name: 'Active', value: stats.activeTreatments },
    { name: 'Completed', value: stats.completedTreatments }
  ]

  const diseaseDistribution = diagnoses.reduce((acc: any[], diagnosis) => {
    const existing = acc.find(item => item.disease === diagnosis.predicted_class)
    if (existing) {
      existing.count += 1
    } else {
      acc.push({ disease: diagnosis.predicted_class.replace(/_/g, ' '), count: 1 })
    }
    return acc
  }, [])

  // Generate monthly progress data based on actual data
  // Build disease percentage and cured percentage datasets
  const diseasePercentages = diagnoses.map(d => ({
    label: new Date(d.created_at).toLocaleDateString(),
    value: d.confidence ? Math.round((1 - d.confidence) * 100) : stats.averageDiseasePercentage
  }))

  const curedPercentage = (() => {
    const total = treatments.length
    if (total === 0) return 0
    const completed = treatments.filter(t => t.completed).length
    return Math.round((completed / total) * 100)
  })()

  // Calculate crop health data based on actual disease percentages
  const calculateCropHealth = () => {
    if (!treatments.length) {
      return [
        { name: 'No Data', value: 100, fill: '#9CA3AF' }
      ]
    }
    
    const completedTreatments = treatments.filter(t => t.completed).length
    const totalTreatments = treatments.length
    
    if (totalTreatments === 0) {
      return [
        { name: 'Needs Treatment', value: 100, fill: '#EF4444' }
      ]
    }
    
    const healthyPercentage = Math.round((completedTreatments / totalTreatments) * 100)
    const needsTreatmentPercentage = 100 - healthyPercentage
    
    const result = []
    if (healthyPercentage > 0) {
      result.push({ name: 'Treated', value: healthyPercentage, fill: '#10B981' })
    }
    if (needsTreatmentPercentage > 0) {
      result.push({ name: 'Needs Treatment', value: needsTreatmentPercentage, fill: '#EF4444' })
    }
    
    return result
  }

  const cropHealthData = calculateCropHealth()

  // Calculate treatment effectiveness based on actual data
  const calculateTreatmentEffectiveness = () => {
    const pesticideStats = treatments.reduce((acc: any, treatment) => {
      const name = treatment.pesticide_name
      if (!acc[name]) {
        acc[name] = { total: 0, completed: 0 }
      }
      acc[name].total += 1
      if (treatment.completed) {
        acc[name].completed += 1
      }
      return acc
    }, {})

    return Object.entries(pesticideStats).map(([pesticide, stats]: [string, any]) => ({
      pesticide: pesticide.length > 15 ? pesticide.substring(0, 15) + '...' : pesticide,
      effectiveness: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      treatments: stats.total,
      fullName: pesticide
    })).slice(0, 5) // Show top 5
  }

  const treatmentEffectivenessData = calculateTreatmentEffectiveness()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 dark:text-gray-400">Here's your farm overview</p>
        </div>
        <button
          onClick={() => navigate('/crop-diagnosis')}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Diagnosis
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-600 rounded-xl">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalLands}</p>
              <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">Total Lands</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl shadow-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-600 rounded-xl">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.totalAcres}</p>
              <p className="text-green-700 dark:text-green-300 text-sm font-medium">Total Acres</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-2xl shadow-lg border border-orange-200 dark:border-orange-700">
          <div className="flex items-center">
            <div className="p-3 bg-orange-600 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.activeTreatments}</p>
              <p className="text-orange-700 dark:text-orange-300 text-sm font-medium">Active Treatments</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-6 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-700">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.completedTreatments}</p>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-2xl shadow-lg border border-red-200 dark:border-red-700">
          <div className="flex items-center">
            <div className="p-3 bg-red-600 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.averageDiseasePercentage}%</p>
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">Avg Disease %</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Land Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MapPin className="w-5 h-5 text-blue-600 mr-2" />
            Land Distribution
          </h3>
          {landData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={landData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                  formatter={(value, name, props) => [
                    `${value} acres`,
                    props.payload?.fullName || name
                  ]}
                />
                <Bar dataKey="acres" fill="url(#landGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="landGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
              <p>No land data available</p>
            </div>
          )}
        </div>

        {/* Treatment Status Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 text-green-600 mr-2" />
            Treatment Status
          </h3>
          {treatmentStatusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={treatmentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {treatmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
              <p>No treatment data available</p>
            </div>
          )}
        </div>

        {/* Crop Health Status */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="w-5 h-5 text-purple-600 mr-2" />
            Crop Health
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={cropHealthData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {cropHealthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Disease % and Cured % */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disease Percentage Over Time */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            Disease Percentage Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={diseasePercentages}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }} 
                formatter={(value) => [`${value}%`, 'Disease %']}
              />
              <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cured Percentage */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="w-5 h-5 text-green-600 mr-2" />
            Cured Percentage
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[{ name: 'Cured', value: curedPercentage }, { name: 'Pending', value: 100 - curedPercentage }]}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                <Cell fill="#10B981" />
                <Cell fill="#F59E0B" />
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Disease Distribution */}
      {diseaseDistribution.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            Disease Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={diseaseDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="disease" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="count" fill="url(#diseaseGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="diseaseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#DC2626" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Treatments */}
      {treatments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            Upcoming Treatments
          </h3>
          <div className="space-y-3">
            {treatments.filter(t => !t.completed).slice(0, 5).map((treatment) => (
              <div key={treatment.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Calendar className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{treatment.pesticide_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(treatment.scheduled_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}