import { useNavigate } from 'react-router-dom';
import HoldingCard from './HoldingCard';

export default function HoldingsList({ holdings, onSell, selling }) {
  const navigate = useNavigate();

  if (holdings.length === 0) {
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
      {holdings.map((holding) => (
        <HoldingCard 
          key={holding.transactionId} 
          holding={holding} 
          onSell={onSell}
          selling={selling}
        />
      ))}
    </div>
  );
}