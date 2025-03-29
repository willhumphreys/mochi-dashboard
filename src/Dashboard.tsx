// src/Dashboard.tsx
import { ReactNode } from 'react';

interface DashboardProps {
    tableComponent: ReactNode;
    visualizationComponent: ReactNode;
}

const Dashboard = ({tableComponent, visualizationComponent }: DashboardProps) => {

    return (
        <div className="dashboard-container">
            <div className="data-container">
                {tableComponent}
                {visualizationComponent}
            </div>
        </div>
    );
};

export default Dashboard;