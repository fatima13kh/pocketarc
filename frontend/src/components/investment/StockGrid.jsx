import StockCard from './StockCard';

export default function StockGrid({ stocks }) {
  if (stocks.length === 0) {
    return (
      <div className="empty-stocks">
        <p>No stocks found. Try searching for a stock symbol like AAPL, TSLA, or GOOGL.</p>
      </div>
    );
  }

  return (
    <div className="stocks-grid">
      {stocks.map((stock) => (
        <StockCard key={stock.symbol} stock={stock} />
      ))}
    </div>
  );
}