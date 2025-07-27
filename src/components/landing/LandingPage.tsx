import React from 'react';
import { motion } from 'framer-motion';
import {
  HardHat,
  Calendar,
  Users,
  Truck,
  Shield,
  BarChart3,
  CheckCircle,
  Clock,
  Share2,
  ArrowRight,
  Star,
  Play,
  Zap,
  Target,
  Globe
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  benefits: string[];
}

function FeatureCard({ icon: Icon, title, description, benefits }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-primary-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <ul className="space-y-2">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-center text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 text-success-500 mr-2 flex-shrink-0" />
            {benefit}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Drag-and-drop Gantt charts with automatic dependency management. Perfect for construction timelines.",
      benefits: [
        "Visual timeline management",
        "Automatic task dependencies",
        "Critical path identification",
        "Real-time schedule updates"
      ]
    },
    {
      icon: Truck,
      title: "Procurement Automation",
      description: "Automatically notify suppliers when delivery dates change. Get instant confirmations.",
      benefits: [
        "Automated supplier notifications",
        "Email delivery confirmations",
        "Real-time delivery tracking",
        "Reduce coordination overhead"
      ]
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "Construction-specific QA triggers for ITPs, inspections, and compliance checklists.",
      benefits: [
        "Automated ITP reminders",
        "Pre-pour checklists",
        "Engineer inspection scheduling",
        "Compliance tracking"
      ]
    },
    {
      icon: BarChart3,
      title: "Professional Reports",
      description: "Generate delay registers, progress reports, and executive summaries with PDF/Excel export.",
      benefits: [
        "Delay register documentation",
        "Executive progress reports",
        "Change history tracking",
        "Claims documentation ready"
      ]
    },
    {
      icon: Share2,
      title: "Client Sharing",
      description: "Share live project progress with clients and stakeholders while keeping sensitive data private.",
      benefits: [
        "Real-time project updates",
        "Secure public links",
        "Hide procurement details",
        "Professional client portal"
      ]
    },
    {
      icon: Users,
      title: "Team Coordination",
      description: "Role-based access for PMs, coordinators, subcontractors, and suppliers with tailored workflows.",
      benefits: [
        "Role-based permissions",
        "Approval workflows",
        "Team notifications",
        "Coordinated communication"
      ]
    }
  ];

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Project Manager",
      company: "BuildTech Construction",
      quote: "Gogram transformed how we manage our construction projects. The automatic supplier notifications alone save us hours every week.",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Site Supervisor",
      company: "Premier Builders",
      quote: "Finally, a construction management tool that actually understands how we work. The QA alerts keep us compliant and on schedule.",
      rating: 5
    },
    {
      name: "Jennifer Chang",
      role: "Operations Director",
      company: "Metropolitan Construction",
      quote: "The reporting features have been invaluable for our client presentations and claims documentation. Professional and comprehensive.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <HardHat className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">Gogram</div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <button
                onClick={onGetStarted}
                className="btn btn-primary btn-md"
              >
                Get Started
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Construction Project Management
                <span className="text-primary-200 block">Made Simple</span>
              </h1>
              <p className="text-xl text-primary-100 mb-8 leading-relaxed">
                Built specifically for construction professionals. Manage schedules, coordinate with suppliers, 
                track quality assurance, and keep stakeholders informed with one powerful platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onGetStarted}
                  className="btn btn-white btn-lg flex items-center justify-center space-x-2 hover:bg-gray-50"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary-600 flex items-center justify-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Watch Demo</span>
                </button>
              </div>
              <div className="mt-8 pt-8 border-t border-primary-500">
                <div className="flex items-center space-x-6 text-primary-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>No Credit Card Required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Full Demo Access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Setup in Minutes</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Metro Tower Project</h3>
                    <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
                      On Track
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Overall Progress</span>
                      <span className="font-semibold text-primary-600">73%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full" style={{ width: '73%' }}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">147</div>
                      <div className="text-sm text-gray-600">Tasks Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">23</div>
                      <div className="text-sm text-gray-600">Active Tasks</div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Next milestone: Foundation Pour - Dec 15</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything Construction Teams Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Designed by construction professionals, for construction professionals. 
              Every feature is built with real construction workflows in mind.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Construction Teams Choose Gogram
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Built for the Field</h3>
                    <p className="text-gray-600">Mobile-first design that works perfectly on tablets and phones. Construction workers can update progress on-site.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Construction-Specific</h3>
                    <p className="text-gray-600">Every feature is designed around actual construction workflows - from ITPs to supplier coordination.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Real-Time Coordination</h3>
                    <p className="text-gray-600">Keep everyone synchronized with automatic notifications, updates, and approvals across your entire project team.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-primary-50 to-success-50 rounded-2xl p-8"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">40%</div>
                  <div className="text-sm text-gray-700">Faster Project Completion</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-success-600 mb-2">60%</div>
                  <div className="text-sm text-gray-700">Fewer Coordination Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-warning-600 mb-2">85%</div>
                  <div className="text-sm text-gray-700">Time Saved on Reporting</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-danger-600 mb-2">50%</div>
                  <div className="text-sm text-gray-700">Reduction in Delays</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Construction Professionals
            </h2>
            <p className="text-xl text-gray-600">
              See what project managers and construction teams are saying about Gogram
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-sm text-primary-600">{testimonial.company}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Construction Projects?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join construction professionals who use Gogram to manage their projects efficiently and professionally.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="btn btn-white btn-lg flex items-center justify-center space-x-2 hover:bg-gray-50"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary-600">
                Schedule a Demo Call
              </button>
            </div>
            <p className="text-primary-200 mt-6">
              No credit card required • Full feature access • Setup in under 5 minutes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <HardHat className="w-5 h-5 text-white" />
                </div>
                <div className="text-xl font-bold text-white">Gogram</div>
              </div>
              <p className="text-gray-400 mb-4">
                Professional construction project management platform built for the modern construction industry.
              </p>
              <div className="text-sm text-gray-400">
                © 2024 Gogram. All rights reserved.
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Solutions</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Commercial Construction</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Residential Projects</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Infrastructure</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Renovations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Training</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 