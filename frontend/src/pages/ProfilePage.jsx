import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import PortfolioSummary from '../components/portfolio/PortfolioSummary';
import HoldingsList from '../components/portfolio/HoldingsList';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import { useInvestment } from '../hooks/useInvestment';

const HOLDINGS_PER_PAGE = 5;

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
  // ✅ Hook called at component top level - CORRECT
  const { loading, error, getPortfolio, sellStock } = useInvestment();
  
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [sellError, setSellError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    console.log('🚀 PortfolioPage mounted');
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    console.log('📡 Calling getPortfolio() from hook...');
    setPageLoading(true);
    
    const result = await getPortfolio();
    console.log('📊 Result from getPortfolio:', result);
    
    if (result.success) {
      console.log('✅ Portfolio data received');
      console.log('📈 Holdings array:', result.data.holdings);
      console.log('📈 Holdings count:', result.data.holdings?.length);
      
      setPortfolio(result.data);
      setHoldings(result.data.holdings || []);
    } else {
      console.log('❌ Failed to load portfolio:', result.error);
    }
    
    setPageLoading(false);
  };

  const handleSell = async (transactionId, sharesToSell) => {
    console.log('💰 Selling:', transactionId, sharesToSell);
    setSelling(true);
    setSellError('');
    
    const result = await sellStock({ transactionId, sharesToSell });
    console.log('📊 Sell result:', result);
    
    if (result.success) {
      console.log('✅ Sell successful, reloading portfolio');
      await loadPortfolio();
      setCurrentPage(0);
    } else if (result.error) {
      setSellError(result.error);
    }
    setSelling(false);
  };

  const totalPages = Math.ceil(holdings.length / HOLDINGS_PER_PAGE);
  const paginatedHoldings = holdings.slice(
    currentPage * HOLDINGS_PER_PAGE,
    (currentPage + 1) * HOLDINGS_PER_PAGE
  );

  console.log('🔄 Rendering - Holdings count:', holdings.length, 'Current page:', currentPage);

  if (pageLoading && !portfolio) {
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

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Portfolio" />

      <div className="portfolio-container">
        {error && <Alert message={error} />}
        {sellError && <Alert message={sellError} />}

        {portfolio && (
          <>
            <PortfolioSummary portfolio={portfolio} />
            <div className="holdings-section">
              <h2>Your Holdings ({holdings.length} {holdings.length === 1 ? 'stock' : 'stocks'})</h2>
              
              {holdings.length === 0 ? (
                <div className="empty-holdings">
                  <p>You don't have any investments yet.</p>
                  <p>Go to the Investment Simulator to start building your portfolio!</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => window.location.href = '/simulator'}
                    style={{ marginTop: '16px' }}
                  >
                    Go to Simulator
                  </button>
                </div>
              ) : (
                <>
                  <HoldingsList holdings={paginatedHoldings} onSell={handleSell} selling={selling} />
                  
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
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}