// src/pages/PortfolioPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import HoldingsList from '../components/portfolio/HoldingsList';
import PortfolioStatistics from '../components/portfolio/PortfolioStatistics';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import { useInvestment } from '../hooks/useInvestment';
import axiosClient from '../api/axiosClient';

const HOLDINGS_PER_PAGE = 6;

const SORT_OPTIONS = [
  { value: 'symbol_asc', label: 'Symbol: A to Z' },
  { value: 'symbol_desc', label: 'Symbol: Z to A' },
  { value: 'value_asc', label: 'Value: Low to High' },
  { value: 'value_desc', label: 'Value: High to Low' },
  { value: 'pl_asc', label: 'P&L: Low to High' },
  { value: 'pl_desc', label: 'P&L: High to Low' },
  { value: 'shares_asc', label: 'Shares: Low to High' },
  { value: 'shares_desc', label: 'Shares: High to Low' },
];

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage < 3) {
        for (let i = 0; i < 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages - 1);
      } else if (currentPage > totalPages - 4) {
        pages.push(0);
        pages.push('...');
        for (let i = totalPages - 4; i < totalPages; i++) pages.push(i);
      } else {
        pages.push(0);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages - 1);
      }
    }
    return pages;
  };

  return (
    <div className="pagination">
      <button
        className="pagination-btn pagination-arrow"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        ← Prev
      </button>
      
      {getPageNumbers().map((p, i) =>
        p === '...' ? (
          <span key={i} className="pagination-dots">...</span>
        ) : (
          <button
            key={p}
            className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        )
      )}
      
      <button
        className="pagination-btn pagination-arrow"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
      >
        Next →
      </button>
    </div>
  );
}

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { loading: investmentLoading, error: investmentError, getPortfolio, sellStock, buyStock } = useInvestment();
  
  const [holdings, setHoldings] = useState([]);
  const [filteredHoldings, setFilteredHoldings] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  
  const [cashBalance, setCashBalance] = useState(0);
  const [holdingsValue, setHoldingsValue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);
  const [totalProfitLossPercent, setTotalProfitLossPercent] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [holdings, searchTerm, sortBy]);

  const loadPortfolio = async () => {
    setPageLoading(true);
    const result = await getPortfolio();
    if (result.success) {
      const allHoldings = result.data.holdings || [];
      const validHoldings = allHoldings.filter(h => h.shares > 0);
      setHoldings(validHoldings);
      setHoldingsValue(result.data.totalValueBhd || 0);
      setTotalCost(result.data.totalCostBhd || 0);
      setTotalProfitLoss(result.data.totalProfitLossBhd || 0);
      setTotalProfitLossPercent(result.data.totalProfitLossPercent || 0);
      await loadPortfolioStats();
    }
    setPageLoading(false);
  };

  const loadPortfolioStats = async () => {
    setStatsLoading(true);
    try {
      const userRes = await axiosClient.get('/users/me');
      const userCashBalance = userRes.data.cashBalance || 0;
      setCashBalance(userCashBalance);
    } catch (err) {
      console.error('Failed to load portfolio stats:', err);
      setStatsError(err.response?.data?.error || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...holdings];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(holding => 
        holding.symbol?.toLowerCase().includes(searchLower) ||
        holding.companyName?.toLowerCase().includes(searchLower)
      );
    }
    
    if (sortBy === 'symbol_asc') {
      result.sort((a, b) => (a.symbol || '').localeCompare(b.symbol || ''));
    } else if (sortBy === 'symbol_desc') {
      result.sort((a, b) => (b.symbol || '').localeCompare(a.symbol || ''));
    } else if (sortBy === 'value_asc') {
      result.sort((a, b) => (a.currentValueBhd || 0) - (b.currentValueBhd || 0));
    } else if (sortBy === 'value_desc') {
      result.sort((a, b) => (b.currentValueBhd || 0) - (a.currentValueBhd || 0));
    } else if (sortBy === 'pl_asc') {
      result.sort((a, b) => (a.profitLossBhd || 0) - (b.profitLossBhd || 0));
    } else if (sortBy === 'pl_desc') {
      result.sort((a, b) => (b.profitLossBhd || 0) - (a.profitLossBhd || 0));
    } else if (sortBy === 'shares_asc') {
      result.sort((a, b) => (a.shares || 0) - (b.shares || 0));
    } else if (sortBy === 'shares_desc') {
      result.sort((a, b) => (b.shares || 0) - (a.shares || 0));
    }
    
    setFilteredHoldings(result);
    setCurrentPage(0);
  };

  const handleSell = async (transactionId, sharesToSell) => {
    setSelling(true);
    try {
      const result = await sellStock({ transactionId, sharesToSell });
      if (result.success) {
        await loadPortfolio();
        setCurrentPage(0);
        return { success: true };
      } else if (result.error) {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to sell stock' };
    } finally {
      setSelling(false);
    }
    return { success: true };
  };

  const handleBuyComplete = async (symbol, companyName, amount) => {
    const result = await buyStock({ symbol, companyName, amountBhd: amount });
    if (result.success) {
      await loadPortfolio();
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const totalPages = Math.ceil(filteredHoldings.length / HOLDINGS_PER_PAGE);
  const paginatedHoldings = filteredHoldings.slice(
    currentPage * HOLDINGS_PER_PAGE,
    (currentPage + 1) * HOLDINGS_PER_PAGE
  );

  if (pageLoading || statsLoading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Portfolio" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner dark />
        </div>
        <Footer />
      </div>
    );
  }

  const displayError = investmentError || statsError;

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Portfolio" />

      <div className="portfolio-container">
        {displayError && <Alert message={displayError} />}

        <PortfolioStatistics
          cashBalance={cashBalance}
          holdingsValue={holdingsValue}
          totalCost={totalCost}
          totalProfitLoss={totalProfitLoss}
          totalProfitLossPercent={totalProfitLossPercent}
        />

        <div className="portfolio-guide">
          <details className="guide-details">
            <summary className="guide-summary"> 📖 Understanding Your Portfolio</summary>
            <div className="guide-content">
              <div className="guide-section">
                <h4>💰 Your Spendable Cash</h4>
                <ul>
                  <li>This is the money you can actually USE for savings goals and investment stories</li>
                  <li>When you sell stocks, this amount increases</li>
                  <li>When you buy stocks or add to goals, this amount decreases</li>
                </ul>
              </div>
              
              <div className="guide-section">
                <h4>📊 Understanding Your Stock Value</h4>
                <ul>
                  <li><strong>Current Stock Value:</strong> What your stocks are worth right now</li>
                  <li><strong>Total Cost:</strong> What you originally paid for your stocks</li>
                  <li><strong>Total P&L:</strong> Your profit or loss = Current Value - Total Cost</li>
                </ul>
              </div>
            </div>
          </details>
        </div>

        <div className="holdings-toolbar">
          <div className="holdings-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by symbol or company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="holdings-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Sort By</option>
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="holdings-section">
          <h2>Your Holdings ({filteredHoldings.length} {filteredHoldings.length === 1 ? 'stock' : 'stocks'})</h2>
          
          {filteredHoldings.length === 0 ? (
            <div className="empty-holdings">
              {searchTerm ? (
                <>
                  <p>No stocks found matching "{searchTerm}"</p>
                  <button className="btn btn-secondary" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <p>You don't have any investments yet.</p>
                  <p>Go to the Investment Simulator to start building your portfolio!</p>
                  <button className="btn btn-primary" onClick={() => navigate('/simulator')}>
                    Go to Simulator
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <HoldingsList 
                holdings={paginatedHoldings} 
                onSell={handleSell} 
                selling={selling}
                onBuyComplete={handleBuyComplete}
              />
              
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}