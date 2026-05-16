// src/pages/PortfolioStockDetailPage.jsx
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
import axiosClient from '../api/axiosClient';
import BuyStockModal from '../components/investment/BuyStockModal';

const MINIMUM_SHARES_THRESHOLD = 0.0001;

export default function PortfolioStockDetailPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [holding, setHolding] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellShares, setSellShares] = useState('');
  const [sellError, setSellError] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);
  const { buyStock, sellStock, getPortfolio } = useInvestment();
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
    loadData();
  }, [symbol]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const userRes = await axiosClient.get('/users/me');
      setCashBalance(userRes.data.cashBalance || 0);

      const [quoteRes, historyRes, portfolioRes] = await Promise.all([
        investmentApi.getStockQuote(symbol),
        investmentApi.getStockHistory(symbol),
        investmentApi.getPortfolio()
      ]);
      
      if (!quoteRes.data) {
        throw new Error('Stock not found');
      }
      
      setStock(quoteRes.data);
      
      const holdings = portfolioRes.data.holdings || [];
      const stockHolding = holdings.find(h => h.symbol === symbol.toUpperCase());
      setHolding(stockHolding || null);
      
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
      const result = await buyStock({
        symbol: stock.symbol,
        companyName: stock.name,
        amountBhd: amount
      });
      if (result.success) {
        await getPortfolio();
        setShowBuyModal(false);
        await loadData();
      }
    } catch (err) {
      console.error('Purchase failed:', err);
    } finally {
      setBuyLoading(false);
    }
  };

  // SELL ALL - use exact shares value (no rounding)
  const handleSellAll = async () => {
    if (!holding) return;
    
    setSellLoading(true);
    setSellError('');
    try {
      const result = await sellStock({ 
        transactionId: holding.transactionId, 
        sharesToSell: holding.shares  // Use exact value, no rounding
      });
      if (result.success) {
        await getPortfolio();
        navigate('/portfolio');
      } else if (result.error) {
        setSellError(result.error);
      }
    } catch (err) {
      setSellError(err.message || 'Failed to sell shares. Please try again.');
    } finally {
      setSellLoading(false);
    }
  };

  // SELL PARTIAL - validate correctly
  const handleSellPartial = async () => {
    if (!holding) return;
    
    let sharesNum = parseFloat(sellShares);
    
    if (isNaN(sharesNum)) {
      setSellError('Please enter a valid number of shares');
      return;
    }
    
    if (sharesNum <= 0) {
      setSellError('Please enter a positive number of shares');
      return;
    }
    
    // Compare with exact shares from backend (no rounding)
    if (sharesNum > holding.shares + 0.000001) {
      setSellError(`Cannot sell more than ${holding.shares.toFixed(6)} shares. You own ${holding.shares.toFixed(6)} shares.`);
      return;
    }
    
    setSellLoading(true);
    setSellError('');
    
    try {
      const result = await sellStock({ 
        transactionId: holding.transactionId, 
        sharesToSell: sharesNum 
      });
      if (result.success) {
        await getPortfolio();
        navigate('/portfolio');
      } else if (result.error) {
        setSellError(result.error);
      }
    } catch (err) {
      setSellError(err.message || 'Failed to sell shares. Please try again.');
    } finally {
      setSellLoading(false);
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
          <Button onClick={() => navigate('/portfolio')}>Back to Portfolio</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isPositive = stock.changePercent >= 0;
  const changeBhd = stock.priceBhd * (Math.abs(stock.changePercent) / 100);
  const sharesOwned = holding ? holding.shares : 0;
  // Display exact shares WITHOUT rounding - show full precision
  const displayShares = sharesOwned.toString();
  const hasShares = sharesOwned > MINIMUM_SHARES_THRESHOLD;

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Stock Details" />

      <div className="stock-detail-page">
        <button className="back-button" onClick={() => navigate('/portfolio')}>
          ← Back to Portfolio
        </button>

        <div className="stock-detail-card">
          <div className="stock-detail-header">
            <div>
              <h1>{stock.name}</h1>
              <span className="stock-symbol-large">{stock.symbol}</span>
            </div>
            <div className="stock-action-buttons">
              <Button variant="primary" onClick={() => setShowBuyModal(true)}>
                Buy More
              </Button>
              {hasShares && (
                <>
                  <Button variant="danger" onClick={handleSellAll} disabled={sellLoading}>
                    {sellLoading ? 'Processing...' : 'Sell All'}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowSellModal(true)}>
                    Sell Partial
                  </Button>
                </>
              )}
            </div>
          </div>

          {hasShares && (
            <div className="stock-holdings-info">
              <h3>Your Holdings</h3>
              <div className="holdings-info-grid">
                <div className="info-item">
                  <span className="info-label">Shares Owned</span>
                  <span className="info-value">{displayShares}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Avg Cost</span>
                  <span className="info-value">{holding?.purchasePriceBhd.toLocaleString()} BHD</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Total Cost</span>
                  <span className="info-value">{holding?.totalCostBhd.toLocaleString()} BHD</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Current Value</span>
                  <span className="info-value">{holding?.currentValueBhd.toLocaleString()} BHD</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Profit/Loss</span>
                  <span className={`info-value ${holding?.profitLossBhd >= 0 ? 'positive' : 'negative'}`}>
                    {holding?.profitLossBhd >= 0 ? '+' : ''}{holding?.profitLossBhd.toLocaleString()} BHD
                  </span>
                </div>
              </div>
            </div>
          )}

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

      <BuyStockModal
        stock={stock}
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onBuy={handleBuy}
        loading={buyLoading}
        cashBalance={cashBalance}
      />

      {showSellModal && (
        <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sell {stock.symbol} - Partial Shares</h2>
              <button className="modal-close" onClick={() => setShowSellModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Shares available to sell: <strong>{displayShares}</strong></label>
                <label>Current price: {stock.priceBhd.toLocaleString()} BHD</label>
                <input
                  type="number"
                  placeholder="Enter shares to sell"
                  value={sellShares}
                  onChange={(e) => {
                    setSellShares(e.target.value);
                    setSellError('');
                  }}
                  step="0.000001"
                  min="0.000001"
                  max={sharesOwned}
                  autoFocus
                />
                {sellShares && parseFloat(sellShares) > 0 && (
                  <div className="sell-preview">
                    You will receive: {(parseFloat(sellShares) * stock.priceBhd).toLocaleString()} BHD
                  </div>
                )}
              </div>
              {sellError && <div className="alert alert-error" style={{ marginTop: '12px' }}>{sellError}</div>}
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => {
                setShowSellModal(false);
                setSellError('');
                setSellShares('');
              }}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleSellPartial} disabled={sellLoading}>
                {sellLoading ? 'Processing...' : 'Confirm Sell'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}