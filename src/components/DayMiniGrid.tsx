"use client";

// Uzywany w DashboardClient (Plan dnia widget) + CheckOutClient (Plan dnia sekcja).

import { TaskChips } from "@/components/TaskChips";
import { taskStatus, type TaskStatus } from "@/lib/plan/task-status";
import type { TydzienTask } from "@/lib/plan/tydzien-types";

const HOUR_START = 6;
const HOUR_END = 23;
const HOUR_HEIGHT = 40;
const HOURS = Array.from(
  { length: HOUR_END - HOUR_START + 1 },
  (_, i) => HOUR_START + i,
);

function parseMin(t?: string): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

interface Props {
  tasks: TydzienTask[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  showUntimed?: boolean;
}

export function DayMiniGrid({ tasks, onStatusChange, showUntimed = true }: Props) {
  const timedTasks = tasks
    .map((t) => ({
      ...t,
      startMin: parseMin(t.startTime),
      endMin: parseMin(t.endTime),
    }))
    .filter((t) => t.startMin !== null && t.endMin !== null && t.endMin > t.startMin);

  const untimedTasks = tasks.filter(
    (t) => parseMin(t.startTime) === null || parseMin(t.endTime) === null,
  );

  const gridHeight = (HOUR_END - HOUR_START + 1) * HOUR_HEIGHT;

  return (
    <>
      {showUntimed && untimedTasks.length > 0 && (
        <ul className="dash-mini-grid-untimed" style={{ marginBottom: 12 }}>
          {untimedTasks.map((t) => {
            const status = taskStatus(t);
            return (
              <li key={t.id} className={`dash-mini-grid-untimed-${status}`}>
                <TaskChips
                  status={status}
                  onChange={(s) => onStatusChange(t.id, s)}
                  size="sm"
                />
                <span className="dash-mini-grid-untimed-text">{t.text}</span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="dash-mini-grid" style={{ height: gridHeight }}>
        <div className="dash-mini-grid-hours">
          {HOURS.map((h) => (
            <div
              key={h}
              className="dash-mini-grid-hour-label"
              style={{ height: HOUR_HEIGHT }}
            >
              {String(h).padStart(2, "0")}
            </div>
          ))}
        </div>
        <div className="dash-mini-grid-slots">
          {HOURS.map((h) => (
            <div
              key={h}
              className="dash-mini-grid-hour-row"
              style={{ height: HOUR_HEIGHT }}
            />
          ))}
          {timedTasks.map((task) => {
            const top =
              ((task.startMin! - HOUR_START * 60) / 60) * HOUR_HEIGHT;
            const height =
              ((task.endMin! - task.startMin!) / 60) * HOUR_HEIGHT;
            if (top < 0 || top > gridHeight) return null;
            const status = taskStatus(task);
            return (
              <div
                key={task.id}
                className={`dash-mini-grid-block dash-mini-grid-block-${status}`}
                style={{ top, height }}
                title={`${task.startTime}-${task.endTime} ${task.text}`}
              >
                <span className="dash-mini-grid-block-time">
                  {task.startTime}-{task.endTime}
                </span>
                <span className="dash-mini-grid-block-text">{task.text}</span>
                <span className="dash-mini-grid-block-chips">
                  <TaskChips
                    status={status}
                    onChange={(s) => onStatusChange(task.id, s)}
                    size="sm"
                  />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
