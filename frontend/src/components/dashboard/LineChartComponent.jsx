// src/components/dashboard/LineChartComponent.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload, label, valuePrefix = '', valueSuffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="dashboard-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, index) => (
          <p key={index} className="tooltip-value" style={{ color: p.color }}>
            {p.name}: {valuePrefix}{p.value?.toLocaleString()}{valueSuffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function LineChartComponent({ 
  data, 
  lines, 
  xKey = 'date',
  height = 300,
  valuePrefix = '',
  valueSuffix = '',
  title 
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
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval="preserveStartEnd"
          />
          <YAxis 
            tickFormatter={(value) => {
              if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
              return value;
            }}
            tick={{ fontSize: 11, fill: 'var(--text-h)' }}
          />
          <Tooltip content={<CustomTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} />
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}