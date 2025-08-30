import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts'
import { Leaf, MapPin, Calendar, AlertTriangle, CheckCircle, Plus, Activity, Target, TrendingUp, Clock, Shield } from 'lucide-react'

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

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316']

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

  // Generate treatment effectiveness over time
  const generateTreatmentProgress = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    return last7Days.map(date => {
      const dayTreatments = treatments.filter(t => 
        t.scheduled_date.split('T')[0] === date
      )
      const completed = dayTreatments.filter(t => t.completed).length
      const total = dayTreatments.length
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed,
        pending: total - completed,
        total
      }
    })
  }

  // Generate crop health trend
  const generateCropHealthTrend = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date
    })

    return last30Days.map((date, index) => {
      // Simulate improving health over time based on treatments
      const completedTreatments = treatments.filter(t => 
        new Date(t.scheduled_date) <= date && t.completed
      ).length
      
      const baseHealth = Math.max(20, 100 - stats.averageDiseasePercentage)
      const improvement = Math.min(30, completedTreatments * 5)
      const healthScore = Math.min(100, baseHealth + improvement)
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        health: healthScore,
        disease: Math.max(0, 100 - healthScore)
      }
    }).filter((_, index) => index % 3 === 0) // Show every 3rd day for cleaner chart
  }

  // Generate pesticide usage statistics
  const generatePesticideUsage = () => {
    const pesticideStats = treatments.reduce((acc: any, treatment) => {
      const name = treatment.pesticide_name.split(' ')[0] // Get first word for shorter names
      if (!acc[name]) {
        acc[name] = { used: 0, effective: 0 }
      }
      acc[name].used += 1
      if (treatment.completed) {
        acc[name].effective += 1
      }
      return acc
    }, {})

    return Object.entries(pesticideStats)
      .map(([pesticide, stats]: [string, any]) => ({
        pesticide,
        used: stats.used,
        effectiveness: stats.used > 0 ? Math.round((stats.effective / stats.used) * 100) : 0
      }))
      .slice(0, 6) // Show top 6
  }

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

  const treatmentProgressData = generateTreatmentProgress()
  const cropHealthTrendData = generateCropHealthTrend()
  const pesticideUsageData = generatePesticideUsage()

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
        {/* Treatment Progress (Last 7 Days) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
            Treatment Progress (7 Days)
          </h3>
          {treatmentProgressData.some(d => d.total > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={treatmentProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="completed" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="treatmentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
              <p>No treatment data available</p>
            </div>
          )}
        </div>

        {/* Crop Health Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 text-green-600 mr-2" />
            Crop Health Trend (30 Days)
          </h3>
          {cropHealthTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={cropHealthTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                  formatter={(value, name) => [`${value}%`, name === 'health' ? 'Health Score' : 'Disease Level']}
                />
                <Area 
                  type="monotone" 
                  dataKey="health" 
                  stackId="1" 
                  stroke="#10B981" 
                  fill="url(#healthGradient)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="disease" 
                  stackId="1" 
                  stroke="#EF4444" 
                  fill="url(#diseaseGradient)" 
                />
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="diseaseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
              <p>No health trend data available</p>
            </div>
          )}
        </div>

        {/* Pesticide Usage & Effectiveness */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 text-purple-600 mr-2" />
            Pesticide Effectiveness
          </h3>
          {pesticideUsageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pesticideUsageData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="pesticide" type="category" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                  formatter={(value, name, props) => [
                    `${value}%`,
                    `Effectiveness (${props.payload?.used} treatments)`
                  ]}
                />
                <Bar dataKey="effectiveness" fill="url(#effectivenessGradient)" radius={[0, 4, 4, 0]} />
                <defs>
                  <linearGradient id="effectivenessGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
              <p>No pesticide data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Overview and Treatment Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Treatment Overview */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            Monthly Treatment Overview
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">This Month</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {treatments.filter(t => {
                        const treatmentDate = new Date(t.scheduled_date)
                        const now = new Date()
                        return treatmentDate.getMonth() === now.getMonth() && 
                               treatmentDate.getFullYear() === now.getFullYear()
                      }).length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {treatments.length > 0 ? Math.round((stats.completedTreatments / treatments.length) * 100) : 0}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upcoming This Week</h4>
              <div className="space-y-2">
                {treatments
                  .filter(t => {
                    const treatmentDate = new Date(t.scheduled_date)
                    const now = new Date()
                    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                    return treatmentDate >= now && treatmentDate <= weekFromNow && !t.completed
                  })
                  .slice(0, 3)
                  .map((treatment, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{treatment.pesticide_name.split(' ')[0]}</span>
                      <span className="text-gray-500 dark:text-gray-500">
                        {new Date(treatment.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                {treatments.filter(t => {
                  const treatmentDate = new Date(t.scheduled_date)
                  const now = new Date()
                  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                  return treatmentDate >= now && treatmentDate <= weekFromNow && !t.completed
                }).length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-500">No treatments scheduled this week</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Land Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MapPin className="w-5 h-5 text-orange-600 mr-2" />
            Land Distribution
          </h3>
          {landData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
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
                    <stop offset="0%" stopColor="#F97316" />
                    <stop offset="100%" stopColor="#EA580C" />
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
      </div>

      {/* Treatment Effectiveness Analysis */}
      {pesticideUsageData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="w-5 h-5 text-purple-600 mr-2" />
            Pesticide Usage & Effectiveness Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Usage Frequency</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pesticideUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="pesticide" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                    formatter={(value) => [`${value} times`, 'Used']}
                  />
                  <Bar dataKey="used" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Effectiveness Rate</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pesticideUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="pesticide" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                    formatter={(value) => [`${value}%`, 'Effectiveness']}
                  />
                  <Bar dataKey="effectiveness" fill="url(#effectivenessBarGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="effectivenessBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
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