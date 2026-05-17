// src/pages/InvestmentSimulatorPage.jsx
import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import StockFilters from '../components/investment/StockFilters';
import StockGrid from '../components/investment/StockGrid';
import BuyStockModal from '../components/investment/BuyStockModal';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import { useInvestment } from '../hooks/useInvestment';

const STOCKS_PER_PAGE = 8;

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

export default function InvestmentSimulatorPage() {
  const [allStocks, setAllStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingStocks, setLoadingStocks] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  // Separate sort states
  const [priceSort, setPriceSort] = useState('');
  const [changeSort, setChangeSort] = useState('');
  const [nameSort, setNameSort] = useState('');
  
  const { loading, error, searchStocks, getPopularStocks, buyStock, getPortfolio } = useInvestment();

  // Load initial stocks
  useEffect(() => {
    loadPopularStocks();
  }, []);

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [allStocks, searchTerm, sectorFilter, priceSort, changeSort, nameSort]);

  const loadPopularStocks = async () => {
    setLoadingStocks(true);
    const result = await getPopularStocks();
    if (result.success) {
      setAllStocks(result.data);
    }
    setLoadingStocks(false);
  };

  const applyFiltersAndSort = () => {
    let result = [...allStocks];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(stock => 
        stock.symbol?.toLowerCase().includes(searchLower) ||
        stock.name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sector filter
    if (sectorFilter) {
      result = result.filter(stock => stock.sector === sectorFilter);
    }
    
    // Apply Price sorting
    if (priceSort === 'price_asc') {
      result.sort((a, b) => (a.priceBhd || 0) - (b.priceBhd || 0));
    } else if (priceSort === 'price_desc') {
      result.sort((a, b) => (b.priceBhd || 0) - (a.priceBhd || 0));
    }
    
    // Apply Change sorting
    if (changeSort === 'change_asc') {
      result.sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0));
    } else if (changeSort === 'change_desc') {
      result.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
    }
    
    // Apply Name sorting
    if (nameSort === 'name_asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (nameSort === 'name_desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }
    
    setFilteredStocks(result);
    setCurrentPage(0);
  };

  // Handle search change with debounce
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  // Handle search submit
  const handleSearch = async (value) => {
    if (value.trim()) {
      setLoadingStocks(true);
      const result = await searchStocks(value);
      if (result.success) {
        setAllStocks(result.data);
      }
      setLoadingStocks(false);
    } else {
      await loadPopularStocks();
    }
  };

  const handleBuyClick = (stock) => {
    setSelectedStock(stock);
    setShowModal(true);
  };

  const handleBuy = async (symbol, companyName, amountBhd) => {
    const result = await buyStock({ symbol, companyName, amountBhd });
    if (result.success) {
      setShowModal(false);
      setSelectedStock(null);
      await getPortfolio();
      if (searchTerm) {
        await handleSearch(searchTerm);
      } else {
        await loadPopularStocks();
      }
    }
  };

  const totalPages = Math.ceil(filteredStocks.length / STOCKS_PER_PAGE);
  const paginatedStocks = filteredStocks.slice(
    currentPage * STOCKS_PER_PAGE,
    (currentPage + 1) * STOCKS_PER_PAGE
  );

  if (loadingStocks && allStocks.length === 0) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Investment Simulator" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner dark />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Investment Simulator" />

      <div className="stocks-container">
        <StockFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          sectorFilter={sectorFilter}
          onSectorChange={setSectorFilter}
          priceSort={priceSort}
          onPriceSortChange={setPriceSort}
          changeSort={changeSort}
          onChangeSortChange={setChangeSort}
          nameSort={nameSort}
          onNameSortChange={setNameSort}
          loading={loadingStocks}
        />

        {/* User Guide Section */}
        <div className="stocks-guide">
          <details className="guide-details">
            <summary className="guide-summary"> 📖 Understanding Stock Prices & Changes</summary>
            <div className="guide-content">
              <div className="guide-section">
                <h4>📊 Price & Change Information</h4>
                <ul>
                  <li><strong>↑ Green / ↓ Red:</strong> Shows if the stock price went <span className="positive-text">up</span> or <span className="negative-text">down</span></li>
                  <li><strong>Percentage (e.g., +1.05%):</strong> How much the price changed compared to previous close</li>
                  <li><strong>+3.14 USD:</strong> The actual dollar amount the price changed</li>
                  <li><strong>0% / +0 USD:</strong> Stock price didn't change (can happen on weekends/holidays or when market is closed)</li>
                </ul>
              </div>
              <div className="guide-section">
                <h4>📈 Price History Chart</h4>
                <ul>
                  <li>The chart shows the stock's closing price over the last 30 days</li>
                  <li><strong>Green line:</strong> Overall upward trend</li>
                  <li><strong>Red line:</strong> Overall downward trend</li>
                  <li>Hover over any point to see the price on that date</li>
                </ul>
              </div>
              <div className="guide-section">
                <h4>💡 Tips</h4>
                <ul>
                  <li>Prices update every 2 hours from real market data</li>
                  <li>After buying, check your Portfolio to track profit/loss</li>
                  <li>Use filters to find stocks by sector or price range</li>
                </ul>
              </div>
            </div>
          </details>
        </div>

        {error && <Alert message={error} />}

        {paginatedStocks.length === 0 && !loadingStocks ? (
          <div className="empty-stocks">
            <p>No stocks found. Try searching for a stock symbol like AAPL, TSLA, or GOOGL.</p>
          </div>
        ) : (
          <>
            <StockGrid stocks={paginatedStocks} />
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <BuyStockModal
        stock={selectedStock}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedStock(null);
        }}
        onBuy={handleBuy}
        loading={loading}
      />

      <Footer />
    </div>
  );
}