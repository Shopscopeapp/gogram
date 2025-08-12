import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInDays, eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns';
import { BarChart3, Calendar, Clock, List } from 'lucide-react';
import type { Task } from '../../types';
import './NextGantt.css';

export interface NextGanttChartProps {
  tasks: Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick?: (task: Task) => void;
  readOnly?: boolean;
  showDependencies?: boolean;
  timelineStart?: Date;
  timelineEnd?: Date;
}

interface GanttTask extends Task {
  level?: number;
  predecessors?: string[];
  successors?: string[];
  lag_days?: number;
  is_critical?: boolean;
}

const CONFIG = {
  rowHeight: 44,
  taskBarHeight: 22,
  taskNameWidth: 320,
  dayWidth: 36,
  mobileBreakpoint: 768,
};

export default function NextGanttChart({
  tasks,
  onTaskUpdate,
  onTaskClick,
  readOnly = false,
  showDependencies = true,
  timelineStart,
  timelineEnd,
}: NextGanttChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'timeline'>('timeline');

  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < CONFIG.mobileBreakpoint);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Basic critical path calculation (lightweight parity)
  const calculateCritical = (items: GanttTask[]): Set<string> => {
    const critical = new Set<string>();
    const byId = new Map(items.map(t => [t.id, t] as const));
    // Mark tasks with zero float as critical using a simple heuristic: any task that others depend on with no slack
    items.forEach(t => {
      const successors = items.filter(s => (s.predecessors || []).includes(t.id));
      if (successors.length === 0) return;
      const latestPredFinish = (tt: GanttTask) => new Date(tt.end_date).getTime();
      successors.forEach(s => {
        const starts = new Date(s.start_date).getTime();
        if (starts <= latestPredFinish(t)) {
          critical.add(t.id);
          critical.add(s.id);
        }
      });
    });
    // Respect explicit flag as well
    items.forEach(t => { if (t.is_critical) critical.add(t.id); });
    return critical;
  };

  const processedTasks = useMemo(() => {
    // Keep ordering stable by start_date then created_at
    const sorted = [...tasks].sort((a, b) => {
      const sa = new Date(a.start_date).getTime();
      const sb = new Date(b.start_date).getTime();
      if (sa !== sb) return sa - sb;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }) as GanttTask[];
    const critical = calculateCritical(sorted);
    return sorted.map(t => ({ ...t, is_critical: critical.has(t.id) }));
  }, [tasks]);

  const bounds = useMemo(() => {
    if (processedTasks.length === 0) {
      const now = new Date();
      const start = startOfMonth(now);
      const end = endOfMonth(addDays(now, 30));
      return { start, end, days: eachDayOfInterval({ start, end }) };
    }
    const minStart = timelineStart || new Date(Math.min(...processedTasks.map(t => new Date(t.start_date).getTime())));
    const maxEnd = timelineEnd || new Date(Math.max(...processedTasks.map(t => new Date(t.end_date).getTime())));
    const start = startOfMonth(minStart);
    const end = endOfMonth(maxEnd);
    return { start, end, days: eachDayOfInterval({ start, end }) };
  }, [processedTasks, timelineStart, timelineEnd]);

  // Sync header/body scroll
  useEffect(() => {
    const h = headerRef.current;
    const b = bodyRef.current;
    if (!h || !b) return;
    const onHeader = () => { b.scrollLeft = h.scrollLeft; };
    const onBody = () => { h.scrollLeft = b.scrollLeft; };
    h.addEventListener('scroll', onHeader);
    b.addEventListener('scroll', onBody);
    return () => {
      h.removeEventListener('scroll', onHeader);
      b.removeEventListener('scroll', onBody);
    };
  }, []);

  // Drag support with simple dependency cascade (finish-to-start + lag)
  const onDragStart = (task: GanttTask, startClientX: number) => {
    if (readOnly) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const deltaX = clientX - startClientX;
      const el = document.querySelector(`[data-next-task-id="${task.id}"]`) as HTMLElement | null;
      if (el) {
        el.style.transform = `translateX(${deltaX}px)`;
        el.style.opacity = '0.8';
      }
    };
    const onUp = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const deltaX = clientX - startClientX;
      const daysDelta = Math.round(deltaX / CONFIG.dayWidth);
      // Reset visual
      const el = document.querySelector(`[data-next-task-id="${task.id}"]`) as HTMLElement | null;
      if (el) {
        el.style.transform = '';
        el.style.opacity = '';
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', onUp);
      if (!daysDelta || !onTaskUpdate) return;

      const duration = differenceInDays(new Date(task.end_date), new Date(task.start_date));
      const newStart = addDays(new Date(task.start_date), daysDelta);
      const newEnd = addDays(newStart, duration);
      onTaskUpdate(task.id, { start_date: newStart, end_date: newEnd });

      // Cascade successors
      const byId = new Map(processedTasks.map(t => [t.id, t] as const));
      const visited = new Set<string>();
      const updateSucc = (taskId: string) => {
        if (visited.has(taskId)) return; visited.add(taskId);
        processedTasks.forEach(s => {
          if ((s.predecessors || []).includes(taskId)) {
            const base = byId.get(taskId);
            if (!base) return;
            const lag = s.lag_days || 0;
            const sDuration = differenceInDays(new Date(s.end_date), new Date(s.start_date));
            const sNewStart = addDays(new Date(base.end_date), lag);
            const sNewEnd = addDays(sNewStart, sDuration);
            onTaskUpdate(s.id, { start_date: sNewStart, end_date: sNewEnd });
            // Mutate local map for chained cascades
            byId.set(s.id, { ...s, start_date: sNewStart, end_date: sNewEnd });
            updateSucc(s.id);
          }
        });
      };
      updateSucc(task.id);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', onUp);
  };

  const renderHeader = () => {
    // Group days by month label
    const months: { name: string; count: number }[] = [];
    let current = '';
    bounds.days.forEach(d => {
      const name = format(d, 'MMM yyyy');
      if (name !== current) {
        months.push({ name, count: 1 });
        current = name;
      } else {
        months[months.length - 1].count += 1;
      }
    });
    return (
      <div className="nextgantt-header">
        <div className="nextgantt-names-col">
          <div className="nextgantt-header-cell">Tasks</div>
        </div>
        <div className="nextgantt-timeline" ref={headerRef}>
          <div className="nextgantt-months">
            {months.map((m, idx) => (
              <div key={idx} className="nextgantt-month" style={{ width: m.count * CONFIG.dayWidth }}>
                {m.name}
              </div>
            ))}
          </div>
          <div className="nextgantt-days">
            {bounds.days.map((d, i) => (
              <div key={i} className="nextgantt-day" style={{ width: CONFIG.dayWidth }}>
                <div className="nextgantt-day-num">{format(d, 'd')}</div>
                <div className="nextgantt-day-name">{format(d, 'EEE')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRow = (t: GanttTask, index: number) => {
    const startOffset = differenceInDays(new Date(t.start_date), bounds.start) * CONFIG.dayWidth;
    const barWidth = Math.max(CONFIG.dayWidth, differenceInDays(new Date(t.end_date), new Date(t.start_date)) * CONFIG.dayWidth);
    const critical = t.is_critical ? 'critical' : '';
    return (
      <div key={t.id} className="nextgantt-row" style={{ height: CONFIG.rowHeight }}>
        <div className="nextgantt-name-cell" onClick={() => onTaskClick?.(t)}>
          <div className="nextgantt-name-main">{t.title}</div>
          <div className="nextgantt-name-meta">
            <span className="meta"><Calendar className="icon" />{format(new Date(t.start_date), 'MMM dd')} - {format(new Date(t.end_date), 'MMM dd')}</span>
            <span className="meta"><Clock className="icon" />{Math.max(0, Math.min(100, t.progress_percentage || 0))}%</span>
          </div>
        </div>
        <div className="nextgantt-canvas">
          <div
            className={`nextgantt-bar ${critical}`}
            data-next-task-id={t.id}
            style={{ left: startOffset, width: barWidth, height: CONFIG.taskBarHeight }}
            onMouseDown={(e) => onDragStart(t, e.clientX)}
            onTouchStart={(e) => onDragStart(t, e.touches[0].clientX)}
          >
            <div className="nextgantt-progress" style={{ width: `${Math.max(0, Math.min(100, t.progress_percentage || 0))}%` }} />
            <span className="nextgantt-label">{barWidth > 80 ? t.title : ''}</span>
          </div>
          {/* Simple dependency indicators (lines can be enhanced later) */}
          {showDependencies && (t.predecessors && t.predecessors.length > 0) && (
            <div className="nextgantt-dep-indicator" title={`Depends on ${t.predecessors.length} task(s)`} />
          )}
        </div>
      </div>
    );
  };

  if (!processedTasks.length) {
    return (
      <div className="nextgantt-empty">
        <BarChart3 className="icon" />
        <h3>No tasks to display</h3>
        <p>Add tasks to see them in the timeline</p>
      </div>
    );
  }

  return (
    <div className={`nextgantt ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="nextgantt-toolbar">
        <div className="left">
          <strong>Next‑Gen Gantt</strong>
        </div>
        {isMobile && (
          <button className="toggle" onClick={() => setMobileView(mobileView === 'list' ? 'timeline' : 'list')}>
            <List className="icon" /> {mobileView === 'list' ? 'Show Timeline' : 'Show List'}
          </button>
        )}
      </div>

      {(!isMobile || mobileView === 'timeline') && renderHeader()}

      <div className="nextgantt-body">
        <div className="nextgantt-names-col" style={{ width: CONFIG.taskNameWidth }}>
          {/* sticky name column placeholder to match header height */}
          <div className="nextgantt-header-spacer" />
          {processedTasks.map((t, i) => (
            <div key={t.id} className="nextgantt-name-row" style={{ height: CONFIG.rowHeight }}>
              <div className="name-text" onClick={() => onTaskClick?.(t)}>
                <div className="title">{t.title}</div>
                <div className="sub">{format(new Date(t.start_date), 'MMM dd')} • {Math.max(0, Math.min(100, t.progress_percentage || 0))}%</div>
              </div>
            </div>
          ))}
        </div>
        <div className="nextgantt-timeline" ref={bodyRef}>
          {/* grid days */}
          <div className="nextgantt-grid">
            {processedTasks.map((t, i) => (
              <div key={`grid-${t.id}`} className="grid-row" style={{ height: CONFIG.rowHeight }}>
                {bounds.days.map((d, idx) => (
                  <div key={idx} className="grid-cell" style={{ width: CONFIG.dayWidth }} />
                ))}
              </div>
            ))}
          </div>
          {/* bars */}
          <div className="nextgantt-rows">
            {processedTasks.map((t, i) => renderRow(t, i))}
          </div>
        </div>
      </div>
    </div>
  );
}


