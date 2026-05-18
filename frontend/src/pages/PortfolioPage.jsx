import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import HoldingsList from '../components/portfolio/HoldingsList';
import PortfolioStatistics from '../components/portfolio/PortfolioStatistics';
import HoldingsFilterBar from '../components/portfolio/HoldingsFilterBar';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import { useInvestment } from '../hooks/useInvestment';
import axiosClient from '../api/axiosClient';

const HOLDINGS_PER_PAGE = 4;

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
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Separate sort states
  const [nameSort, setNameSort] = useState('');
  const [valueSort, setValueSort] = useState('');
  const [changeSort, setChangeSort] = useState('');
  const [sharesSort, setSharesSort] = useState('');
  
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
  }, [holdings, searchTerm, categoryFilter, nameSort, valueSort, changeSort, sharesSort]);

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
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(holding => 
        holding.symbol?.toLowerCase().includes(searchLower) ||
        holding.companyName?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(holding => holding.sector === categoryFilter);
    }
    
    // Apply Name sorting
    if (nameSort === 'name_asc') {
      result.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
    } else if (nameSort === 'name_desc') {
      result.sort((a, b) => (b.companyName || '').localeCompare(a.companyName || ''));
    }
    
    // Apply Value sorting
    if (valueSort === 'value_asc') {
      result.sort((a, b) => (a.currentValueBhd || 0) - (b.currentValueBhd || 0));
    } else if (valueSort === 'value_desc') {
      result.sort((a, b) => (b.currentValueBhd || 0) - (a.currentValueBhd || 0));
    }
    
    // Apply Change sorting (P&L)
    if (changeSort === 'pl_asc') {
      result.sort((a, b) => (a.profitLossBhd || 0) - (b.profitLossBhd || 0));
    } else if (changeSort === 'pl_desc') {
      result.sort((a, b) => (b.profitLossBhd || 0) - (a.profitLossBhd || 0));
    }
    
    // Apply Shares sorting
    if (sharesSort === 'shares_asc') {
      result.sort((a, b) => (a.shares || 0) - (b.shares || 0));
    } else if (sharesSort === 'shares_desc') {
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

        {/* Portfolio Statistics */}
        <PortfolioStatistics
          cashBalance={cashBalance}
          holdingsValue={holdingsValue}
          totalCost={totalCost}
          totalProfitLoss={totalProfitLoss}
          totalProfitLossPercent={totalProfitLossPercent}
        />

        {/* User Guide Section - AFTER Statistics */}
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
                  <li><strong>Cash is real money</strong> - you can withdraw it to your goals anytime</li>
                </ul>
              </div>
              
              <div className="guide-section">
                <h4>📊 Understanding Your Stock Value</h4>
                <ul>
                  <li><strong>Current Stock Value:</strong> What your stocks are worth right now based on live market prices</li>
                  <li><strong>Total Cost:</strong> What you originally paid for your stocks (your investment basis)</li>
                  <li><strong>Total P&L:</strong> Your profit or loss = Current Value - Total Cost</li>
                  <li><span className="positive-text">Green numbers</span> mean you're in profit</li>
                  <li><span className="negative-text">Red numbers</span> mean you're at a loss</li>
                </ul>
              </div>

              <div className="guide-section">
                <h4>📈 Understanding Profit & Loss (P&L)</h4>
                <ul>
                  <li><strong>Unrealized P&L:</strong> Paper profit/loss on stocks you still own - <span className="warning-text">not real until you sell!</span></li>
                  <li><strong>Realized P&L:</strong> Actual profit/loss from stocks you've already sold - <span className="success-text">this is real money!</span></li>
                  <li>The <strong>Change</strong> column shows how each stock is performing today</li>
                </ul>
              </div>

              <div className="guide-section">
                <h4>💡 Pro Tips</h4>
                <ul>
                  <li>🔍 Use the search bar to find specific stocks</li>
                  <li>📂 Filter by category to see stocks from specific sectors</li>
                  <li>📊 Sort by Value, Change, or Shares to organize your portfolio</li>
                  <li>💰 Click <strong>Buy More</strong> to add to your position</li>
                  <li>💸 Click <strong>Sell All</strong> or <strong>Sell Partial</strong> to take profits or cut losses</li>
                  <li>📈 Stock prices update every 2 hours with real market data</li>
                </ul>
              </div>
            </div>
          </details>
        </div>

        <HoldingsFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          nameSort={nameSort}
          onNameSortChange={setNameSort}
          valueSort={valueSort}
          onValueSortChange={setValueSort}
          changeSort={changeSort}
          onChangeSortChange={setChangeSort}
          sharesSort={sharesSort}
          onSharesSortChange={setSharesSort}
          loading={pageLoading}
        />

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