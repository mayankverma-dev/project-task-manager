import React from 'react';
import { useWorkspaceDashboard } from '../hooks/useWorkspaceDashboard.js';
import { useSelector } from 'react-redux';
import { Users, Folder, CheckCircle, Clock, AlertCircle, Circle } from 'lucide-react';
import { DashboardStatSkeleton } from './DashboardStatSkeleton.jsx';

export const WorkspaceDashboard = () => {
  const activeWorkspace = useSelector(state => state.workspaces.activeWorkspace);
  const { data: stats, isLoading, isError } = useWorkspaceDashboard(activeWorkspace?.id);

  if (!activeWorkspace) {
    return <div>Select a workspace to view dashboard.</div>;
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 mb-6 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded w-48" />
        {/* 2 overview cards + 4 status cards = 6 total */}
        <DashboardStatSkeleton count={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <div className="p-4 text-red-700 bg-red-100 rounded-lg">
          Failed to load workspace statistics.
        </div>
      </div>
    );
  }

  const statusConfig = {
    todo: { icon: Circle, label: 'To Do', color: 'text-gray-500' },
    in_progress: { icon: Clock, label: 'In Progress', color: 'text-blue-500' },
    in_review: { icon: AlertCircle, label: 'In Review', color: 'text-purple-500' },
    done: { icon: CheckCircle, label: 'Done', color: 'text-green-500' },
  };

  const StatCard = ({ icon: Icon, title, value, colorClass = "text-gray-900", iconClass = "text-gray-500" }) => (
    <div className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium tracking-wide text-gray-500 uppercase">{title}</h3>
        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>
      <p className={`text-3xl font-bold ${colorClass}`}>{value || 0}</p>
    </div>
  );

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={Folder} 
          title="Total Projects" 
          value={stats?.totalProjects} 
        />
        <StatCard 
          icon={Users} 
          title="Team Members" 
          value={stats?.totalMembers} 
        />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-gray-800">Task Overview</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <StatCard
            key={status}
            icon={config.icon}
            title={config.label}
            value={stats?.tasksByStatus?.[status]}
            iconClass={config.color}
          />
        ))}
      </div>
    </div>
  );
};
