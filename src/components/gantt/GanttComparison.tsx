import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Zap, 
  Settings, 
  ChevronDown,
  Check,
  Star,
  Smartphone,
  Move,
  Link,
  Clock,
  Users,
  Target
} from 'lucide-react';
import ChartGantt from './ChartGantt';
import CustomGanttChart from './CustomGanttChart';
import NextGanttChart from './NextGanttChart';
import type { Task } from '../../types';

interface GanttComparisonProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  readOnly?: boolean;
}

type GanttFramework = 'custom' | 'next' | 'chartjs';

interface FrameworkInfo {
  id: GanttFramework;
  name: string;
  description: string;
  icon: React.ReactNode;
  pros: string[];
  cons: string[];
  bestFor: string[];
  features: {
    dragDrop: boolean;
    dependencies: boolean;
    criticalPath: boolean;
    resourceManagement: boolean;
    mobileOptimized: boolean;
    customStyling: boolean;
    realTimeUpdates: boolean;
    largeDatasets: boolean;
  };
}

const frameworks: FrameworkInfo[] = [
  {
    id: 'next',
    name: 'Next‑Gen Gantt (New)',
    description: 'Refined design, faster UI, simpler dependency cascade, mobile-first timeline/list',
    icon: <Zap className="w-6 h-6" />,
    pros: [
      'Modern, clean visual design',
      'Smooth drag & cascade updates',
      'Sticky name column, grid lines',
      'Mobile timeline/list toggle',
      'Critical path highlighting'
    ],
    cons: [
      'Arrows/lines intentionally minimal',
      'Early iteration for advanced features'
    ],
    bestFor: [
      'Side-by-side comparison',
      'User testing & iteration',
      'Production-ready with gradual enhancement'
    ],
    features: {
      dragDrop: true,
      dependencies: true,
      criticalPath: true,
      resourceManagement: false,
      mobileOptimized: true,
      customStyling: true,
      realTimeUpdates: true,
      largeDatasets: true
    }
  },
  {
    id: 'chartjs',
    name: 'Chart.js',
    description: 'Lightweight, flexible charting library with excellent tooltips and animations',
    icon: <BarChart3 className="w-6 h-6" />,
    pros: [
      'Lightweight (~50KB)',
      'Excellent tooltips & animations',
      'Great for data visualization',
      'Easy to customize',
      'Good performance'
    ],
    cons: [
      'Limited Gantt-specific features',
      'No built-in drag & drop',
      'No dependency arrows',
      'Basic timeline navigation'
    ],
    bestFor: [
      'Simple project timelines',
      'Data-heavy visualizations',
      'Custom chart requirements',
      'Performance-critical apps'
    ],
    features: {
      dragDrop: false,
      dependencies: false,
      criticalPath: false,
      resourceManagement: false,
      mobileOptimized: true,
      customStyling: true,
      realTimeUpdates: true,
      largeDatasets: true
    }
  },
  {
    id: 'custom',
    name: 'Custom Gantt Chart',
    description: 'Built-from-scratch Gantt chart with full control and all features',
    icon: <Zap className="w-6 h-6" />,
    pros: [
      'Complete control over features',
      'Drag & drop scheduling',
      'Task dependencies & critical path',
      'Mobile-optimized design',
      'Construction-specific features',
      'Perfect integration with our system'
    ],
    cons: [
      'Requires maintenance',
      'Custom implementation',
      'No external community support'
    ],
    bestFor: [
      'Complex project management',
      'Construction workflows',
      'Custom business logic',
      'Full control requirements'
    ],
    features: {
      dragDrop: true,
      dependencies: true,
      criticalPath: true,
      resourceManagement: true,
      mobileOptimized: true,
      customStyling: true,
      realTimeUpdates: true,
      largeDatasets: true
    }
  }
];

export default function GanttComparison({ 
  tasks, 
  onTaskClick, 
  onTaskUpdate, 
  readOnly = false 
}: GanttComparisonProps) {
  const [selectedFramework, setSelectedFramework] = useState<GanttFramework>('next');
  const [showComparison, setShowComparison] = useState(false);

  const currentFramework = frameworks.find(f => f.id === selectedFramework)!;

  const renderGanttChart = () => {
    const commonProps = {
      tasks,
      onTaskClick,
      onTaskUpdate,
      readOnly
    };

    switch (selectedFramework) {
      case 'custom':
        return <CustomGanttChart {...commonProps} />;
      case 'next':
        return <NextGanttChart {...commonProps} />;
      case 'chartjs':
      default:
        return <ChartGantt {...commonProps} />;
    }
  };

  const renderFeatureComparison = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Comparison</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Feature</th>
              {frameworks.map(framework => (
                <th key={framework.id} className="text-center py-3 px-4 font-medium text-gray-900">
                  <div className="flex items-center justify-center space-x-2">
                    {framework.icon}
                    <span>{framework.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { key: 'dragDrop', label: 'Drag & Drop', icon: <Move className="w-4 h-4" /> },
              { key: 'dependencies', label: 'Task Dependencies', icon: <Link className="w-4 h-4" /> },
              { key: 'criticalPath', label: 'Critical Path', icon: <Target className="w-4 h-4" /> },
              { key: 'resourceManagement', label: 'Resource Management', icon: <Users className="w-4 h-4" /> },
              { key: 'mobileOptimized', label: 'Mobile Optimized', icon: <Smartphone className="w-4 h-4" /> },
              { key: 'customStyling', label: 'Custom Styling', icon: <Settings className="w-4 h-4" /> },
              { key: 'realTimeUpdates', label: 'Real-time Updates', icon: <Clock className="w-4 h-4" /> },
              { key: 'largeDatasets', label: 'Large Datasets', icon: <BarChart3 className="w-4 h-4" /> }
            ].map(feature => (
              <tr key={feature.key} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 flex items-center space-x-2">
                  {feature.icon}
                  <span>{feature.label}</span>
                </td>
                {frameworks.map(framework => (
                  <td key={framework.id} className="text-center py-3 px-4">
                    {framework.features[feature.key as keyof typeof framework.features] ? (
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <div className="w-5 h-5 bg-gray-200 rounded-full mx-auto"></div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Framework Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Gantt Chart Framework Comparison</h2>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <span>{showComparison ? 'Hide' : 'Show'} Comparison</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showComparison ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {frameworks.map(framework => (
            <motion.button
              key={framework.id}
              onClick={() => setSelectedFramework(framework.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedFramework === framework.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  selectedFramework === framework.id ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  {framework.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{framework.name}</h3>
                  {selectedFramework === framework.id && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-4 h-4 text-primary-600" />
                      <span className="text-sm text-primary-600 font-medium">Selected</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{framework.description}</p>
              
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                    Best for: {framework.bestFor[0]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {framework.pros.slice(0, 2).map(pro => (
                    <span key={pro} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {pro}
                    </span>
                  ))}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Current Framework Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            {currentFramework.icon}
            <h4 className="font-semibold text-gray-900">{currentFramework.name}</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-green-700 mb-2">Strengths</h5>
              <ul className="space-y-1">
                {currentFramework.pros.map(pro => (
                  <li key={pro} className="flex items-center space-x-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-orange-700 mb-2">Considerations</h5>
              <ul className="space-y-1">
                {currentFramework.cons.map(con => (
                  <li key={con} className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-4 h-4 bg-orange-200 rounded-full flex-shrink-0"></div>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      {showComparison && renderFeatureComparison()}

      {/* Side-by-Side Live Compare */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Side-by-Side Live Compare</h3>
          <div className="text-sm text-gray-500">Current vs New • Interact with both</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">Current (Custom)</div>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <CustomGanttChart tasks={tasks} onTaskClick={onTaskClick} onTaskUpdate={onTaskUpdate} readOnly={readOnly} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">New (Next‑Gen)</div>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <NextGanttChart tasks={tasks} onTaskClick={onTaskClick} onTaskUpdate={onTaskUpdate} readOnly={readOnly} />
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart Display (Single-Select Demo) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Live Demo: {currentFramework.name}
          </h3>
          <div className="text-sm text-gray-500">
            {tasks.length} tasks • All functions preserved
          </div>
        </div>
        
        {renderGanttChart()}
        
        {/* Implementation Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            🔧 Implementation Notes for {currentFramework.name}
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>✅ <strong>All existing functions preserved:</strong> Task management, filtering, status updates, progress tracking</p>
            <p>✅ <strong>Business logic intact:</strong> Supplier integration, material tracking, user permissions</p>
            <p>✅ <strong>UI components maintained:</strong> Add Task Modal, statistics dashboard, search controls</p>
            <p>✅ <strong>Data transformations:</strong> Seamless conversion between our Task interface and framework format</p>
            {selectedFramework === 'custom' && (
              <p>🎯 <strong>Custom-specific:</strong> Full control, construction features, mobile optimization, drag & drop</p>
            )}
            {selectedFramework === 'chartjs' && (
              <p>🎯 <strong>Chart.js-specific:</strong> Advanced tooltips, smooth animations, excellent performance</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}