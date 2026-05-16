import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import { investmentApi } from '../api/investmentApi';
import { useInvestment } from '../hooks/useInvestment';
import { useGoals } from '../context/GoalsContext';
import BuyStockModal from '../components/investment/BuyStockModal';

export default function StockDetailPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const { buyStock, getPortfolio } = useInvestment();
  const { cashBalance } = useGoals();
  const [chartWidth, setChartWidth] = useState(800);

  useEffect(() => {
    const handleResize = () => {
      setChartWidth(Math.min(800, window.innerWidth - 80));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadStockData();
  }, [symbol]);

  const loadStockData = async () => {
    setLoading(true);
    setError('');
    try {
      const [quoteRes, historyRes] = await Promise.all([
        investmentApi.getStockQuote(symbol),
        investmentApi.getStockHistory(symbol)
      ]);
      
      if (!quoteRes.data) {
        throw new Error('Stock not found');
      }
      
      setStock(quoteRes.data);
      
      const formattedHistory = (historyRes.data || []).map(item => ({
        date: item.date,
        price: item.close,
        open: item.open,
        high: item.high,
        low: item.low
      }));
      
      setHistory(formattedHistory);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (amount) => {
    setBuyLoading(true);
    try {
      await buyStock({
        symbol: stock.symbol,
        companyName: stock.name,
        amountBhd: amount
      });
      await getPortfolio();
      setShowBuyModal(false);
      await loadStockData();
    } catch (err) {
      // Error is handled in the modal now
      console.error('Purchase failed:', err);
    } finally {
      setBuyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Stock Details" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner dark />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Stock Details" />
        <div className="stock-detail-error">
          <Alert message={error || 'Stock not found'} />
          <Button onClick={() => navigate('/simulator')}>Back to Simulator</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isPositive = stock.changePercent >= 0;
  const changeBhd = stock.priceBhd * (Math.abs(stock.changePercent) / 100);

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Stock Details" />

      <div className="stock-detail-page">
        <button className="back-button" onClick={() => navigate('/simulator')}>
          ← Back to Simulator
        </button>

        <div className="stock-detail-card">
          <div className="stock-detail-header">
            <div>
              <h1>{stock.name}</h1>
              <span className="stock-symbol-large">{stock.symbol}</span>
            </div>
            <Button onClick={() => setShowBuyModal(true)}>Buy Stock</Button>
          </div>

          <div className="stock-price-section">
            <div className="current-price">
              <span className="price-label">Price Per Share</span>
              <span className="price-value">{stock.priceBhd?.toLocaleString() || 0} BHD</span>
              <span className="price-usd">${stock.priceUsd?.toLocaleString() || 0} USD</span>
            </div>
            <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
              <span className="change-percent">{isPositive ? '↑' : '↓'} {Math.abs(stock.changePercent || 0)}%</span>
              <span className="change-amount">{isPositive ? '+' : ''}{stock.changeUsd?.toLocaleString() || 0} USD</span>
              <span className="change-amount-bhd">
                ({isPositive ? '+' : ''}{changeBhd.toLocaleString()} BHD)
              </span>
            </div>
          </div>

          {history.length > 0 && (
            <div className="stock-chart">
              <h3>Price History (30 Days)</h3>
              
              <div className="chart-legend-simple">
                <span className="legend-hint">💡 Hover over the chart to see exact prices</span>
              </div>

              <div className="chart-wrapper">
                <LineChart
                  width={chartWidth}
                  height={350}
                  data={history}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: 'var(--muted)' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={Math.floor(history.length / 8)}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value?.toLocaleString() || 0}`}
                    tick={{ fontSize: 11, fill: 'var(--text-h)', fontWeight: 500 }}
                    width={65}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value?.toLocaleString() || 0} BHD`, 'Price']}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke={isPositive ? 'var(--success)' : 'var(--error)'} 
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </div>
              
              <div className="chart-note-simple">
                <span className="note-up">↑ Green = Price increased</span>
                <span className="note-down">↓ Red = Price decreased</span>
              </div>
            </div>
          )}

          {stock.sector && (
            <div className="stock-info">
              <div className="info-row">
                <span className="info-label">Sector:</span>
                <span className="info-value">{stock.sector}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buy Modal */}
      <BuyStockModal
        stock={stock}
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onBuy={handleBuy}
        loading={buyLoading}
        cashBalance={cashBalance}
      />

      <Footer />
    </div>
  );
}