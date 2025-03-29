// src/Dashboard.tsx
import { ReactNode } from 'react';

interface DashboardProps {
  title?: string;
  tableComponent: ReactNode;
  visualizationComponent: ReactNode;
}

const Dashboard = ({ title = 'Trading Strategy Dashboard', tableComponent, visualizationComponent }: DashboardProps) => {
  return (
    <div className="dashboard-container">
      <h1>{title}</h1>
      <div className="data-container">
        {tableComponent}
        {visualizationComponent}
      </div>
    </div>
  );
};

export default Dashboard;