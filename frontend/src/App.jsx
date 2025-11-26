import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState([])
  const [recommendedProducts, setRecommendedProducts] = useState([])
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('recommended')

  const exampleQueries = [
    { icon: '📱', text: 'I want a phone under ₹30,000 with good camera' },
    { icon: '🎧', text: 'Best wireless headphones for working out' },
    { icon: '💻', text: 'Laptop for programming under ₹60,000' },
    { icon: '⌚', text: 'Smartwatch with heart rate monitor' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) {
      setError('Please enter what you\'re looking for')
      return
    }

    setLoading(true)
    setError('')
    setProducts([])
    setRecommendedProducts([])
    setAiAnalysis('')

    try {
      const response = await fetch('https://ai-product-recommendation-system-5wyl.onrender.com/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Failed to get recommendations')
      }

      const data = await response.json()
      setProducts(data.products)
      setRecommendedProducts(data.recommended_products)
      setAiAnalysis(data.ai_analysis)
      setActiveTab('recommended')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    if (!price || price === 'N/A') return 'Price unavailable'
    return price
  }

  const renderStars = (rating) => {
    if (!rating) return null
    const stars = Math.round(parseFloat(rating))
    return (
      <div className="stars">
        {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
        <span className="rating-text">{rating}</span>
      </div>
    )
  }

  const formatAiAnalysis = (text) => {
    // Remove JSON array section and clean up
    let cleanText = text
      .replace(/\d*\.*\s*\*\*\d*\.*\s*JSON[^*]*\*\*[\s\S]*$/gi, '')
      .replace(/\*\*\d+\.\s*JSON[^*]*\*\*[\s\S]*$/gi, '')
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/\[[\d,\s]+\]/g, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()

    const parseInlineMarkdown = (str) => {
      // Parse bold text **text**
      const parts = str.split(/(\*\*[^*]+\*\*)/g)
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return part
      })
    }

    return cleanText.split('\n').map((line, index) => {
      // Skip empty lines
      if (!line.trim()) return null
      
      // Skip JSON-related lines
      if (line.includes('```') || line.match(/^\s*\[.*\]\s*$/) || line.toLowerCase().includes('json')) return null

      // Main section headers (1. **Analysis:** or ## Header)
      if (line.match(/^\d+\.\s*\*\*[^*]+:\*\*/)) {
        const headerMatch = line.match(/^\d+\.\s*\*\*([^*]+):\*\*\s*(.*)/)
        if (headerMatch) {
          return (
            <div key={index} className="analysis-section">
              <h4 className="analysis-heading">{headerMatch[1]}</h4>
              {headerMatch[2] && <p className="analysis-text">{parseInlineMarkdown(headerMatch[2])}</p>}
            </div>
          )
        }
      }

      // Bullet points with bold product names
      if (line.match(/^\s*\*\s*\*\*[^*]+\*\*/)) {
        const content = line.replace(/^\s*\*\s*/, '')
        return (
          <div key={index} className="recommendation-item">
            <p>{parseInlineMarkdown(content)}</p>
          </div>
        )
      }

      // Regular bullet points
      if (line.match(/^\s*[\*\-•]\s+/)) {
        const content = line.replace(/^\s*[\*\-•]\s+/, '')
        return <li key={index} className="analysis-item">{parseInlineMarkdown(content)}</li>
      }

      // Numbered items without bold headers
      if (line.match(/^\d+\.\s+/)) {
        const content = line.replace(/^\d+\.\s+/, '')
        return <p key={index} className="analysis-numbered">{parseInlineMarkdown(content)}</p>
      }

      // Regular paragraphs
      return <p key={index} className="analysis-text">{parseInlineMarkdown(line)}</p>
    }).filter(Boolean)
  }

  const ProductCard = ({ product, isRecommended }) => (
    <div className={`product-card ${isRecommended ? 'recommended' : ''}`}>
      {isRecommended && <span className="rec-badge">AI Recommended</span>}
      {product.is_best_seller && <span className="bestseller-badge">Best Seller</span>}
      {product.is_prime && <span className="prime-badge">Prime</span>}
      
      <div className="product-image">
        <img src={product.image} alt={product.title} loading="lazy" />
      </div>
      
      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        
        <div className="product-meta">
          {renderStars(product.rating)}
          {product.reviews_count && (
            <span className="reviews">({product.reviews_count.toLocaleString()} reviews)</span>
          )}
        </div>
        
        <div className="product-pricing">
          <span className="current-price">{formatPrice(product.price)}</span>
          {product.original_price && product.original_price !== product.price && (
            <span className="original-price">{product.original_price}</span>
          )}
        </div>
        
        <a 
          href={product.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="view-btn"
        >
          View on Amazon →
        </a>
      </div>
    </div>
  )

  return (
    <div className="app">
      <div className="bg-pattern"></div>
      
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🛒</span>
          <h1>SmartShop<span>AI</span></h1>
        </div>
        <p className="tagline">AI-powered product recommendations from Amazon</p>
      </header>

      <main className="main">
        <form onSubmit={handleSubmit} className="search-form">
          <div className="input-group main-input">
            <label>What are you looking for?</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., I want a phone under ₹30,000 with good camera"
            />
          </div>
          
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Finding products...
              </>
            ) : (
              <>Get AI Recommendations</>
            )}
          </button>
        </form>

        {!products.length && !loading && (
          <div className="examples">
            <p>Try these examples:</p>
            <div className="example-chips">
              {exampleQueries.map((ex, i) => (
                <button 
                  key={i} 
                  className="example-chip"
                  onClick={() => setQuery(ex.text)}
                >
                  <span>{ex.icon}</span> {ex.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="error-box">
            <span>⚠️</span> {error}
          </div>
        )}

        {aiAnalysis && (
          <div className="ai-analysis">
            <div className="analysis-header">
              <span className="ai-icon">🤖</span>
              <h2>AI Analysis</h2>
            </div>
            <div className="analysis-content">
              {formatAiAnalysis(aiAnalysis)}
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div className="results-section">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'recommended' ? 'active' : ''}`}
                onClick={() => setActiveTab('recommended')}
              >
                AI Recommended ({recommendedProducts.length})
              </button>
              <button 
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Products ({products.length})
              </button>
            </div>

            <div className="products-grid">
              {(activeTab === 'recommended' ? recommendedProducts : products).map((product) => (
                <ProductCard 
                  key={product.asin} 
                  product={product} 
                  isRecommended={recommendedProducts.some(p => p.asin === product.asin)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Powered by Gemini AI & Amazon Data • Built with FastAPI & React</p>
      </footer>
    </div>
  )
}

export default App
