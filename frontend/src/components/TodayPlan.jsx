import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, CalendarCheck } from 'lucide-react';

export default function TodayPlan() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Review TCP 3-Way Handshake & Congestion Control',
      time: '15 mins',
      subject: 'Computer Networks',
      completed: true
    },
    {
      id: 2,
      title: 'Relational Algebra: Joins & Projections',
      time: '20 mins',
      subject: 'Database Systems',
      completed: false
    },
    {
      id: 3,
      title: 'Neural Networks: Backpropagation Intuition',
      time: '25 mins',
      subject: 'Artificial Intelligence',
      completed: false
    }
  ]);

  const toggleTask = (id) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="ui-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <CalendarCheck size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Today's Learning Plan
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              {completedCount} of {tasks.length} tasks completed
            </p>
          </div>
        </div>

        <span className="badge-pill badge-purple" style={{ fontSize: '0.7rem' }}>
          Target: 60m
        </span>
      </div>

      {/* Task Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className="smooth-transition"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${task.completed ? '#e2e8f0' : 'var(--border-color)'}`,
              backgroundColor: task.completed ? 'var(--bg-app)' : '#ffffff',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            {/* Checkbox Icon */}
            <div style={{
              color: task.completed ? '#059669' : 'var(--text-dim)',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {task.completed ? (
                <CheckCircle2 size={18} color="#059669" />
              ) : (
                <Circle size={18} color="#94a3b8" />
              )}
            </div>

            {/* Task Info */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: task.completed ? 'var(--text-muted)' : 'var(--text-main)',
                textDecoration: task.completed ? 'line-through' : 'none',
                lineHeight: 1.35,
                marginBottom: '0.25rem'
              }}>
                {task.title}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} /> {task.time}
                </span>
                <span>•</span>
                <span>{task.subject}</span>
              </div>
            </div>

            {/* Status Indicator */}
            <div>
              {task.completed ? (
                <span className="badge-pill badge-emerald" style={{ fontSize: '0.675rem' }}>
                  Done
                </span>
              ) : (
                <span className="badge-pill badge-amber" style={{ fontSize: '0.675rem' }}>
                  Pending
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
