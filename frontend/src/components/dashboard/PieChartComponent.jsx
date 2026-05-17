// src/components/dashboard/PieChartComponent.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#2d7a4f', '#f59e0b', '#0f766e', '#0891b2', '#8b5cf6', '#dc2626', '#65a30d', '#4b5563', '#d97706', '#ea580c', '#0284c7', '#6b7280'];

const CustomTooltip = ({ active, payload, valuePrefix = '', valueSuffix = '' }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="dashboard-tooltip">
        <p className="tooltip-label">{data.name || data.symbol || data.title}</p>
        <p className="tooltip-value">{valuePrefix}{data.value?.toLocaleString()}{valueSuffix}</p>
        <p className="tooltip-percent">{data.percentage?.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export default function PieChartComponent({ 
  data, 
  height = 300,
  valuePrefix = '',
  valueSuffix = '',
  title,
  dataKey = 'value',
  nameKey = 'name'
}) {
  if (!data || data.length === 0) {
    return (
      <div className="dashboard-chart">
        {title && <h3>{title}</h3>}
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  return (
    <div className="dashboard-chart">
      {title && <h3>{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}