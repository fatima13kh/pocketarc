import { useNavigate } from 'react-router-dom';

export default function StockCard({ stock }) {
  const navigate = useNavigate();
  const isPositive = stock.changePercent >= 0;
  
  // Calculate BHD change amount
  const changeBhd = stock.priceBhd * (stock.changePercent / 100);

  const handleClick = () => {
    const symbol = encodeURIComponent(stock.symbol);
    navigate(`/simulator/${symbol}`);
  };

  return (
    <div className="stock-card" onClick={handleClick}>
      <div className="stock-card-header">
        <div>
          <h3 className="stock-symbol">{stock.symbol}</h3>
          <span className="stock-name">{stock.name}</span>
        </div>
        {stock.sector && <span className="stock-category">{stock.sector}</span>}
      </div>
      <div className="stock-price">
        <span className="current">{stock.priceBhd.toLocaleString()} BHD</span>
        <span className="separator">/</span>
        <span className="usd">${stock.priceUsd.toLocaleString()} USD</span>
      </div>
      <div className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
        <span>{isPositive ? '↑' : '↓'} {Math.abs(stock.changePercent).toFixed(2)}%</span>
        <span>{isPositive ? '+' : ''}{stock.changeUsd.toLocaleString()} USD</span>
        <span className="change-bhd">
          ({isPositive ? '+' : ''}{changeBhd.toLocaleString()} BHD)
        </span>
      </div>
    </div>
  );
}