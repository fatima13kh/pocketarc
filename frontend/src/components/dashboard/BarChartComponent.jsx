// src/components/dashboard/BarChartComponent.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

export default function BarChartComponent({ 
  data, 
  bars, 
  xKey = 'date',
  height = 300,
  valuePrefix = '',
  valueSuffix = '',
  title,
  layout = 'vertical'
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
        <BarChart data={data} layout={layout} margin={{ top: 20, right: 30, left: layout === 'vertical' ? 100 : 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          {layout === 'vertical' ? (
            <>
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--text-h)' }} width={100} />
              <XAxis type="number" tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value;
              }} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'var(--muted)' }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value;
              }} />
            </>
          )}
          <Tooltip content={<CustomTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} />
          {bars.map((bar, index) => (
            <Bar key={index} dataKey={bar.dataKey} name={bar.name} fill={bar.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}