// src/components/portfolio/HoldingsList.jsx
import { useNavigate } from 'react-router-dom';
import HoldingCard from './HoldingCard';

const MINIMUM_SHARES_THRESHOLD = 0.0001;

export default function HoldingsList({ holdings, onSell, selling, onBuyComplete }) {
  const navigate = useNavigate();

  const validHoldings = holdings.filter(holding => {
    const shares = typeof holding.shares === 'number' ? holding.shares : parseFloat(holding.shares);
    return shares > MINIMUM_SHARES_THRESHOLD;
  });

  if (validHoldings.length === 0) {
    return (
      <div className="empty-holdings">
        <p>You don't have any investments yet.</p>
        <p>Go to the Investment Simulator to start building your portfolio!</p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/simulator')}
          style={{ marginTop: '16px' }}
        >
          Go to Simulator
        </button>
      </div>
    );
  }

  return (
    <div className="holdings-list">
      {validHoldings.map((holding) => (
        <HoldingCard 
          key={holding.symbol} 
          holding={holding} 
          onSell={onSell}
          selling={selling}
          onBuyComplete={onBuyComplete}
        />
      ))}
    </div>
  );
}