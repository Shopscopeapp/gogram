import React from 'react';
import ChartGantt from './ChartGantt';
import type { Task } from '../../types';

interface GanttChartProps {
  tasks: Task[];
  onTaskMove?: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  onTaskClick?: (task: Task) => void;
  onTaskReorder?: (activeId: string, overId: string) => void;
  readOnly?: boolean;
  showDependencies?: boolean;
  timelineStart?: Date;
  timelineEnd?: Date;
  onAddTask?: () => void;
}

export default function GanttChart({
  tasks,
  onTaskMove,
  onTaskClick,
  onTaskReorder,
  readOnly = false,
  showDependencies = true,
  timelineStart,
  timelineEnd,
  onAddTask
}: GanttChartProps) {
  
  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    if (onTaskMove && updates.start_date && updates.end_date) {
      onTaskMove(taskId, new Date(updates.start_date), new Date(updates.end_date));
    }
  };

  return (
    <ChartGantt
      tasks={tasks}
      onTaskClick={onTaskClick}
      onTaskUpdate={handleTaskUpdate}
      readOnly={readOnly}
      height={Math.max(400, tasks.length * 40 + 200)} // Dynamic height based on task count
    />
  );
}