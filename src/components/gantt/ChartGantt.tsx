import React, { useMemo, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format, differenceInDays } from 'date-fns';
import type { Task } from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface ChartGanttProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  readOnly?: boolean;
  height?: number;
}

interface GanttDataPoint {
  x: [Date, Date]; // [start, end]
  y: string; // task name
  taskId: string;
  task: Task;
}

export default function ChartGantt({ 
  tasks, 
  onTaskClick, 
  onTaskUpdate, 
  readOnly = false,
  height = 600 
}: ChartGanttProps) {
  const chartRef = useRef<ChartJS<'bar', GanttDataPoint[], string>>(null);
  
  // Cleanup chart instance on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  // Transform tasks into Chart.js format
  const chartData = useMemo((): ChartData<'bar', GanttDataPoint[], string> => {
    // Filter and validate tasks first
    const validTasks = tasks.filter(task => {
      // Ensure task has valid dates
      let startDate = new Date(task.start_date);
      let endDate = new Date(task.end_date);
      
      // Check if dates are valid and within reasonable range
      const isStartValid = !isNaN(startDate.getTime()) && 
                          startDate.getTime() > 0 && 
                          startDate.getFullYear() >= 2000 && 
                          startDate.getFullYear() <= 2100;
      const isEndValid = !isNaN(endDate.getTime()) && 
                        endDate.getTime() > 0 && 
                        endDate.getFullYear() >= 2000 && 
                        endDate.getFullYear() <= 2100;
      
      if (!isStartValid || !isEndValid) {
        console.warn('Invalid task dates found:', {
          taskId: task.id,
          title: task.title,
          start_date: task.start_date,
          end_date: task.end_date,
          startValid: isStartValid,
          endValid: isEndValid
        });
        return false;
      }
      
              // Auto-fix tasks with invalid date ranges
        if (endDate <= startDate) {
                  // Auto-fixing task with invalid date range
          
          // Set reasonable default dates if dates are completely invalid
          const now = new Date();
          const currentYear = now.getFullYear();
          
          // If dates are way off (before 2000 or after 2100), reset to current timeframe
          if (startDate.getFullYear() < 2000 || startDate.getFullYear() > 2100) {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
          }
          
          if (endDate.getFullYear() < 2000 || endDate.getFullYear() > 2100) {
            endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
          }
          
          // If end date is still before start date, swap them
          if (endDate < startDate) {
            const temp = startDate;
            startDate = endDate;
            endDate = temp;
          }
          
          // Ensure at least 1 day duration
          if (endDate.getTime() === startDate.getTime()) {
            endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          }
          
          // Update the task object with corrected dates
          task.start_date = startDate;
          task.end_date = endDate;
          
                  // Date range fixed successfully
        }
      
      return true;
    });

    if (validTasks.length === 0) {
      console.warn('No valid tasks found for Gantt chart');
      return { labels: [], datasets: [] };
    }

    // Group tasks by category for better organization
    const tasksByCategory = validTasks.reduce((acc, task) => {
      const category = task.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    const datasets = Object.entries(tasksByCategory).map(([category, categoryTasks], categoryIndex) => {
      const categoryColors = [
        { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgb(59, 130, 246)' }, // Blue
        { bg: 'rgba(16, 185, 129, 0.8)', border: 'rgb(16, 185, 129)' }, // Green
        { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgb(245, 158, 11)' }, // Yellow
        { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgb(239, 68, 68)' }, // Red
        { bg: 'rgba(139, 92, 246, 0.8)', border: 'rgb(139, 92, 246)' }, // Purple
        { bg: 'rgba(236, 72, 153, 0.8)', border: 'rgb(236, 72, 153)' }, // Pink
      ];

      const colorIndex = categoryIndex % categoryColors.length;
      const colors = categoryColors[colorIndex];

      return {
        label: category,
        data: categoryTasks.map(task => {
          // Ensure dates are valid Date objects
          const startDate = new Date(task.start_date);
          const endDate = new Date(task.end_date);
          
          return {
            x: [startDate, endDate] as [Date, Date],
            y: task.title,
            taskId: task.id,
            task: task
          };
        }),
        backgroundColor: (ctx: any) => {
          const task = ctx.parsed?.task;
          if (!task) return colors.bg;
          
          // Color based on status
          switch (task.status) {
            case 'completed':
              return 'rgba(16, 185, 129, 0.8)'; // Green
            case 'in_progress':
              return 'rgba(245, 158, 11, 0.8)'; // Orange
            case 'delayed':
              return 'rgba(239, 68, 68, 0.8)'; // Red
            case 'pending':
              return 'rgba(156, 163, 175, 0.8)'; // Gray
            default:
              return colors.bg;
          }
        },
        borderColor: (ctx: any) => {
          const task = ctx.parsed?.task;
          if (!task) return colors.border;
          
          switch (task.status) {
            case 'completed':
              return 'rgb(16, 185, 129)';
            case 'in_progress':
              return 'rgb(245, 158, 11)';
            case 'delayed':
              return 'rgb(239, 68, 68)';
            case 'pending':
              return 'rgb(156, 163, 175)';
            default:
              return colors.border;
          }
        },
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      };
    });

    // Create labels from all unique task names
    const labels = validTasks.map(task => task.title);

    return {
      labels,
      datasets
    };
  }, [tasks]);

  // Chart configuration
  const options = useMemo((): ChartOptions<'bar'> => {
    // Get valid tasks for min/max calculation
    const validTasks = tasks.filter(task => {
      const startDate = new Date(task.start_date);
      const endDate = new Date(task.end_date);
      
      const isStartValid = !isNaN(startDate.getTime()) && 
                          startDate.getTime() > 0 && 
                          startDate.getFullYear() >= 2000 && 
                          startDate.getFullYear() <= 2100;
      const isEndValid = !isNaN(endDate.getTime()) && 
                        endDate.getTime() > 0 && 
                        endDate.getFullYear() >= 2000 && 
                        endDate.getFullYear() <= 2100;
      
      return isStartValid && isEndValid;
    });

    return {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'nearest',
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onTaskClick) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const dataIndex = element.index;
        const dataPoint = chartData.datasets[datasetIndex].data[dataIndex] as GanttDataPoint;
        onTaskClick(dataPoint.task);
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Project Timeline',
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: 20
      },
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const dataPoint = context[0].raw as GanttDataPoint;
            return dataPoint.task.title;
          },
          label: (context) => {
            const dataPoint = context.raw as GanttDataPoint;
            const task = dataPoint.task;
            const duration = differenceInDays(new Date(task.end_date), new Date(task.start_date));
            
            return [
              `Category: ${task.category}`,
              `Status: ${task.status.replace('_', ' ').toUpperCase()}`,
              `Priority: ${task.priority.toUpperCase()}`,
              `Start: ${format(new Date(task.start_date), 'MMM dd, yyyy')}`,
              `End: ${format(new Date(task.end_date), 'MMM dd, yyyy')}`,
              `Duration: ${duration} days`,
              `Progress: ${task.progress_percentage || 0}%`,
              ...(task.description ? [`Description: ${task.description}`] : [])
            ];
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    },
          scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'MMM dd'
            }
          },
          // Set reasonable min/max to prevent extreme date ranges
          min: (() => {
            if (validTasks.length === 0) return new Date('2024-01-01');
            
            const allDates = validTasks.flatMap(task => {
              const start = new Date(task.start_date);
              const end = new Date(task.end_date);
              return [start, end].filter(date => 
                !isNaN(date.getTime()) && 
                date.getFullYear() >= 2000 && 
                date.getFullYear() <= 2100
              );
            });
            
            if (allDates.length === 0) return new Date('2024-01-01');
            
            const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
            return minDate;
          })(),
          max: (() => {
            if (validTasks.length === 0) return new Date('2025-12-31');
            
            const allDates = validTasks.flatMap(task => {
              const start = new Date(task.start_date);
              const end = new Date(task.end_date);
              return [start, end].filter(date => 
                !isNaN(date.getTime()) && 
                date.getFullYear() >= 2000 && 
                date.getFullYear() <= 2100
              );
            });
            
            if (allDates.length === 0) return new Date('2025-12-31');
            
            const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
            return maxDate;
          })(),
        title: {
          display: true,
          text: 'Timeline',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Tasks',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 12
          },
          maxRotation: 0,
          callback: function(value, index) {
            const label = this.getLabelForValue(value as number);
            // Truncate long task names
            return label.length > 25 ? label.substring(0, 25) + '...' : label;
          }
        }
      }
    },
    elements: {
      bar: {
        borderWidth: 2,
      }
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    }
  };
  }, [chartData, onTaskClick, tasks]);

  // Show fallback if no valid tasks
  if (chartData.datasets.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Project Gantt Chart</h3>
        </div>
        <div className="p-8 text-center" style={{ height: height }}>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Valid Tasks Found</h4>
            <p className="text-gray-600 mb-4">
              {tasks.length > 0 
                ? "Tasks have invalid dates and cannot be displayed on the timeline."
                : "No tasks have been created yet."
              }
            </p>
            <p className="text-sm text-gray-500">
              {tasks.length > 0 
                ? "Please check the console for details about invalid task dates."
                : "Add some tasks to see them on the Gantt chart."
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Project Gantt Chart</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Delayed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>Pending</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4" style={{ height: height }}>
        <Bar 
          ref={chartRef}
          data={chartData} 
          options={options}
          key={`gantt-chart-${tasks.length}-${Date.now()}`} // Force re-render on data changes
        />
      </div>
      
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 text-center">
          Click on any task bar to view details • Scroll to zoom • {chartData.labels.length} tasks displayed
        </div>
      </div>
    </div>
  );
}