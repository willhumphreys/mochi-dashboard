// src/DashboardTitle.tsx
import { memo } from 'react';

interface DashboardTitleProps {
  title: string;
}

const DashboardTitle = memo(({ title }: DashboardTitleProps) => {
  return <h1 className="dashboard-title">{title}</h1>;
});

export default DashboardTitle;