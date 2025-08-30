import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Sprout, Shield, BarChart3, Calendar, Users, ArrowRight, CheckCircle, Star, TrendingUp, Leaf, Zap, Target, Brain, Award } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Disease Detection',
    description: 'Three specialized deep learning models with 90%+ accuracy for Corn, Rice, and Wheat disease diagnosis.',
    color: 'bg-green-500'
  },
  {
    icon: Target,
    title: 'Precision Treatment Plans',
    description: 'Customized pesticide recommendations and treatment schedules based on crop condition and disease severity.',
    color: 'bg-blue-500'
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Track treatment progress, disease reduction, and crop health improvements with dynamic dashboards.',
    color: 'bg-purple-500'
  },
  {
    icon: Shield,
    title: 'Expert Pesticide Database',
    description: 'Comprehensive pesticide information with dosage, safety guidelines, and application methods.',
    color: 'bg-orange-500'
  }
]

const testimonials = [
  {
    name: 'Rajesh Kumar',
    location: 'Karnataka',
    rating: 5,
    text: 'FarmCare helped me identify corn rust early. The treatment plan reduced disease by 85% in just 2 weeks!',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    name: 'Priya Sharma',
    location: 'Punjab',
    rating: 5,
    text: 'The rice blast detection was spot-on. Saved my entire harvest with their precise recommendations.',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    name: 'Amit Patel',
    location: 'Gujarat',
    rating: 5,
    text: 'Wheat rust detection accuracy is incredible. The dashboard shows real progress after each treatment.',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  }
]

const stats = [
  { number: '3', label: 'Specialized AI Models' },
  { number: '90%+', label: 'Detection Accuracy' },
  { number: '10', label: 'Disease Types Detected' },
  { number: '85%', label: 'Average Disease Reduction' }
]

const supportedDiseases = [
  { crop: 'Corn', diseases: ['Common Rust', 'Gray Leaf Spot', 'Northern Leaf Blight'], icon: '🌽', color: 'bg-yellow-500' },
  { crop: 'Rice', diseases: ['Brown Spot', 'Leaf Blast', 'Hispa'], icon: '🌾', color: 'bg-green-500' },
  { crop: 'Wheat', diseases: ['Brown Rust', 'Yellow Rust'], icon: '🌾', color: 'bg-amber-500' }
]

export const HomePage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                FarmCare
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/auth')}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 font-medium transition-all transform hover:scale-105 shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Professional Crop
              <span className="block bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Disease Management
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Advanced AI-powered disease detection for Corn, Rice, and Wheat with specialized models 
              achieving 90%+ accuracy and comprehensive treatment management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 font-semibold text-lg transition-all transform hover:scale-105 shadow-xl flex items-center justify-center"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Diseases Section */}
      <section className="py-20 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Specialized Disease Detection
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our AI models are trained to detect specific diseases in three major crops with exceptional accuracy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {supportedDiseases.map((crop, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700"
              >
                <div className={`w-16 h-16 ${crop.color} rounded-2xl flex items-center justify-center mb-6 text-2xl`}>
                  {crop.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {crop.crop}
                </h3>
                <div className="space-y-2">
                  {crop.diseases.map((disease, idx) => (
                    <div key={idx} className="flex items-center text-gray-600 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      <span>{disease}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">Model Accuracy</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">90%+</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive Farm
              <span className="block text-green-600">Management Platform</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From disease detection to treatment tracking, everything you need for professional crop management
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How FarmCare Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Professional crop disease management in simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upload Crop Images</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Capture clear photos of affected crop areas and upload to our platform
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">AI Disease Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Specialized models analyze images with 90%+ accuracy for precise disease identification
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Get Treatment Plan</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Receive customized pesticide recommendations and detailed treatment schedules
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Track Progress</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor treatment effectiveness and disease reduction through dynamic dashboards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials section removed as requested */}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Protect Your Crops?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join professional farmers using AI-powered disease detection and treatment management
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-4 bg-white text-green-600 rounded-xl hover:bg-gray-100 font-semibold text-lg transition-all transform hover:scale-105 shadow-xl"
          >
            Start Professional Farming Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Sprout className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">FarmCare</span>
              </div>
              <p className="text-gray-400">
                Professional AI-powered crop disease management for modern agriculture.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Disease Detection</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Treatment Plans</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Progress Tracking</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Research</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 FarmCare. Professional crop disease management platform.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}