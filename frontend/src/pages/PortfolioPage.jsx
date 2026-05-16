import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import PortfolioSummary from '../components/portfolio/PortfolioSummary';
import HoldingsList from '../components/portfolio/HoldingsList';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import { useInvestment } from '../hooks/useInvestment';

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
  const { loading, error, getPortfolio, sellStock } = useInvestment();
  
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [sellError, setSellError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    setPageLoading(true);
    const result = await getPortfolio();
    if (result.success) {
      setPortfolio(result.data);
      setHoldings(result.data.holdings || []);
    }
    setPageLoading(false);
  };

  const handleSell = async (transactionId, sharesToSell) => {
    setSelling(true);
    setSellError('');
    const result = await sellStock({ transactionId, sharesToSell });
    if (result.success) {
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

            {/* User Guide Section - After Stats, Before Holdings */}
            <div className="portfolio-guide">
              <details className="guide-details">
                <summary className="guide-summary"> 📖 Understanding Your Portfolio & Profit/Loss</summary>
                <div className="guide-content">
                  <div className="guide-section">
                    <h4>📊 What Do These Numbers Mean?</h4>
                    <ul>
                      <li><strong>Shares:</strong> Total number of shares you own (can be fractional)</li>
                      <li><strong>Avg Cost:</strong> Average price you paid per share</li>
                      <li><strong>Current Price:</strong> Latest market price (updates every 2 hours)</li>
                      <li><strong>Total Cost:</strong> What you originally paid (Shares × Avg Cost)</li>
                      <li><strong>Current Value:</strong> What your shares are worth now (Shares × Current Price)</li>
                      <li><strong>Profit/Loss:</strong> Current Value - Total Cost (<span className="positive-text">green = profit</span>, <span className="negative-text">red = loss</span>)</li>
                    </ul>
                  </div>
                  
                  <div className="guide-section">
                    <h4>💰 When Do I Actually Lose Money?</h4>
                    <ul>
                      <li><strong>📉 Unrealized Loss (Paper Loss):</strong> When price drops but you <strong>don't sell</strong>. No money is deducted - it's just a number on screen.</li>
                      <li><strong>💸 Realized Loss:</strong> When you <strong>sell</strong> at a lower price than you bought. Only THEN do you actually lose money.</li>
                      <li><strong>📈 Unrealized Profit:</strong> When price increases but you <strong>don't sell</strong>. You haven't made real money until you sell.</li>
                      <li><strong>✅ Realized Profit:</strong> When you <strong>sell</strong> at a higher price than you bought. That's real money in your pocket!</li>
                    </ul>
                  </div>
                  
                  <div className="guide-section">
                    <h4>💡 Tips for Beginners</h4>
                    <ul>
                      <li>Prices update every 2 hours from real market data</li>
                      <li>Red number (-) doesn't mean you lost cash yet - only if you sell</li>
                      <li>Green number (+) means you could make profit if you sell now</li>
                      <li>Diversify! Don't put all your money in one stock</li>
                      <li>Check the Stock Simulator to learn more about each company</li>
                    </ul>
                  </div>
                </div>
              </details>
            </div>

            <div className="holdings-section">
              <h2>Your Holdings ({holdings.length} {holdings.length === 1 ? 'stock' : 'stocks'})</h2>
              <HoldingsList holdings={paginatedHoldings} onSell={handleSell} selling={selling} />
              
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}