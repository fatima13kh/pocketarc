// components/goals/GoalProjection.jsx
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calculateAverageContribution, calculateProjection, generateChartData, getTargetReachMonth } from '../../utils/projectionCalculator';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const isCurrent = dataPoint.isCurrent;
    const reachedTarget = dataPoint.reachedTarget;
    
    return (
      <div className="projection-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-amount">{payload[0].value.toLocaleString()} BHD</p>
        {isCurrent && <p className="tooltip-note">📍 Current amount</p>}
        {reachedTarget && <p className="tooltip-note">🎯 Target reached!</p>}
        {!isCurrent && !reachedTarget && <p className="tooltip-note">📈 Projected</p>}
      </div>
    );
  }
  return null;
};

export default function GoalProjection({ goal }) {
  const { avgMonthly, totalAdded } = useMemo(() => calculateAverageContribution(goal), [goal]);
  const projection = useMemo(() => calculateProjection(goal), [goal]);
  const chartData = useMemo(() => generateChartData(goal, projection?.monthlyContribution || avgMonthly, 24), [goal, projection?.monthlyContribution, avgMonthly]);
  const targetReachMonth = useMemo(() => getTargetReachMonth(chartData), [chartData]);
  
  // Calculate additional projection details
  const calculationDetails = useMemo(() => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const monthsNeeded = projection?.monthsNeeded || 0;
    const weeklyAmount = avgMonthly / 4;
    const dailyAmount = avgMonthly / 30;
    
    return {
      remaining,
      monthsNeeded,
      weeklyAmount: Math.round(weeklyAmount),
      dailyAmount: Math.round(dailyAmount),
      monthlyAmount: avgMonthly
    };
  }, [goal, avgMonthly, projection]);
  
  // Don't show if no funds added yet
  if (totalAdded === 0) {
    return (
      <div className="goal-projection-section">
        <h3>Projection</h3>
        <div className="projection-empty">
          <p>✨ Add funds to see your savings projection</p>
        </div>
      </div>
    );
  }
  
  // Don't show if already reached target
  if (goal.currentAmount >= goal.targetAmount) {
    return (
      <div className="goal-projection-section">
        <h3>Projection</h3>
        <div className="projection-empty">
          <p>🎉 Congratulations! You've reached your goal!</p>
        </div>
      </div>
    );
  }
  
  // Format remaining amount properly
  const remainingAmount = projection?.remaining || (goal.targetAmount - goal.currentAmount);
  
  return (
    <div className="goal-projection-section">
      <h3>Projection</h3>
      
      <div className="projection-stats">
        <div className="projection-stat">
          <span className="stat-label">Average Monthly</span>
          <span className="stat-value">{avgMonthly.toLocaleString()} BHD</span>
        </div>
        <div className="projection-stat">
          <span className="stat-label">Remaining</span>
          <span className="stat-value">{remainingAmount.toLocaleString()} BHD</span>
        </div>
        <div className="projection-stat">
          <span className="stat-label">Estimated Completion</span>
          <span className="stat-value">{projection?.formattedDate || 'N/A'}</span>
        </div>
        <div className="projection-stat">
          <span className="stat-label">Months Remaining</span>
          <span className="stat-value">{projection?.monthsNeeded || '∞'}</span>
        </div>
      </div>
      
      {/* Chart */}
      {chartData.length > 1 && projection?.monthlyContribution > 0 && (
        <div className="projection-chart">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 30, right: 30, left: 10, bottom: 5 }}>
              {/* No CartesianGrid - removes striped lines */}
              
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
                interval={Math.floor(chartData.length / 6)}
                axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                tickLine={false}
              />
              
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k BHD`;
                  return `${value} BHD`;
                }}
                tick={{ fontSize: 11, fill: 'var(--text-h)', fontWeight: 500 }}
                domain={[0, Math.max(goal.targetAmount, chartData[chartData.length - 1]?.amount || goal.targetAmount)]}
                axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                tickLine={false}
                width={65}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Target line with custom label that is always visible */}
              <ReferenceLine 
                y={goal.targetAmount} 
                stroke="#2d7a4f" 
                strokeDasharray="8 5"
                strokeWidth={2.5}
                label={({ viewBox }) => {
                  const labelX = viewBox.width - 10;
                  const labelY = viewBox.y - 8;
                  return (
                    <g>
                      <rect
                        x={labelX - 95}
                        y={labelY - 12}
                        width="130"
                        height="22"
                        rx="4"
                        fill="#2d7a4f"
                        opacity="0.95"
                      />
                      <text
                        x={labelX - 85}
                        y={labelY}
                        fill="#ffffff"
                        fontSize={11}
                        fontWeight={600}
                        dominantBaseline="middle"
                      >
                        🎯 Target: {goal.targetAmount.toLocaleString()} BHD
                      </text>
                    </g>
                  );
                }}
              />
              
              {/* Projection line */}
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="var(--accent)" 
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const isCurrent = payload.isCurrent;
                  const isTarget = payload.reachedTarget;
                  
                  if (isCurrent) {
                    return <circle cx={cx} cy={cy} r={7} fill="#2d7a4f" stroke="#fff" strokeWidth={2.5} />;
                  }
                  if (isTarget) {
                    return <circle cx={cx} cy={cy} r={8} fill="#2d7a4f" stroke="#fff" strokeWidth={2.5} />;
                  }
                  return <circle cx={cx} cy={cy} r={4} fill="var(--accent)" />;
                }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Enhanced Chart Note with Calculation Breakdown */}
          <div className="chart-note-enhanced">
            <div className="note-main">
              <span className="note-icon">📊</span>
              <span className="note-text">
                Based on <strong>{avgMonthly.toLocaleString()} BHD/month</strong> average contribution
              </span>
            </div>
            
            <div className="note-details">
              <div className="note-detail-item">
                <span className="detail-label">Target:</span>
                <span className="detail-value">{goal.targetAmount.toLocaleString()} BHD</span>
              </div>
              <div className="note-detail-item">
                <span className="detail-label">Remaining:</span>
                <span className="detail-value">{calculationDetails.remaining.toLocaleString()} BHD</span>
              </div>
              <div className="note-detail-item">
                <span className="detail-label">Time needed:</span>
                <span className="detail-value">{calculationDetails.monthsNeeded} months</span>
              </div>
            </div>
            
            <div className="note-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-label">Weekly</span>
                <span className="breakdown-value">{calculationDetails.weeklyAmount.toLocaleString()} BHD</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Daily</span>
                <span className="breakdown-value">{calculationDetails.dailyAmount.toLocaleString()} BHD</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Expected by</span>
                <span className="breakdown-value highlight">{targetReachMonth || projection?.formattedDate?.split(' ').slice(0,2).join(' ') || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}