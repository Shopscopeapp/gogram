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

  // Transform tasks into Chart.js format
  const chartData = useMemo((): ChartData<'bar', GanttDataPoint[], string> => {
    // Group tasks by category for better organization
    const tasksByCategory = tasks.reduce((acc, task) => {
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
        data: categoryTasks.map(task => ({
          x: [new Date(task.start_date), new Date(task.end_date)] as [Date, Date],
          y: task.title,
          taskId: task.id,
          task: task
        })),
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
    const labels = tasks.map(task => task.title);

    return {
      labels,
      datasets
    };
  }, [tasks]);

  // Chart configuration
  const options = useMemo((): ChartOptions<'bar'> => ({
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
  }), [chartData, onTaskClick]);

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
        />
      </div>
      
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 text-center">
          Click on any task bar to view details • Scroll to zoom • {tasks.length} tasks displayed
        </div>
      </div>
    </div>
  );
}