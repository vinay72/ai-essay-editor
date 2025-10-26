import React, { useState, useEffect } from 'react';
import { Search, Send, Sparkles, BookOpen, TrendingUp, Award, ChevronRight, Menu, X, Save, Download, History, Zap } from 'lucide-react';
import './styles.css';

// Mock API endpoints (In production, replace with actual backend)
const API_BASE = 'http://localhost:5000/api';

const OrbitAI = () => {
  const [activeTab, setActiveTab] = useState('undergrad');
  const [essayText, setEssayText] = useState('');
  const [university, setUniversity] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState(null);
  const [viewMode, setViewMode] = useState('feedback'); // 'feedback' or 'edits'
  const [savedEssays, setSavedEssays] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Load saved essays from storage
  useEffect(() => {
    loadSavedEssays();
  }, []);

  const loadSavedEssays = async () => {
    try {
      const keys = await window.storage.list('essay:');
      if (keys && keys.keys) {
        const essays = [];
        for (const key of keys.keys) {
          try {
            const result = await window.storage.get(key);
            if (result) {
              essays.push(JSON.parse(result.value));
            }
          } catch (err) {
            console.log('Error loading essay:', err);
          }
        }
        setSavedEssays(essays.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.log('Storage not available:', error);
    }
  };

  const saveEssay = async () => {
    if (!essayText.trim()) return;
    
    const essay = {
      id: Date.now().toString(),
      text: essayText,
      university,
      level: activeTab,
      timestamp: Date.now(),
      wordCount: essayText.trim().split(/\s+/).length
    };

    try {
      await window.storage.set(`essay:${essay.id}`, JSON.stringify(essay));
      await loadSavedEssays();
      alert('Essay saved successfully!');
    } catch (error) {
      console.error('Error saving essay:', error);
      alert('Failed to save essay');
    }
  };

  const loadEssay = (essay) => {
    setEssayText(essay.text);
    setUniversity(essay.university || '');
    setActiveTab(essay.level || 'undergrad');
    setShowHistory(false);
  };

  const deleteEssay = async (id) => {
    try {
      await window.storage.delete(`essay:${id}`);
      await loadSavedEssays();
    } catch (error) {
      console.error('Error deleting essay:', error);
    }
  };

  const evaluateEssay = async () => {
    if (!essayText.trim()) {
      alert('Please write your essay first!');
      return;
    }

    setIsEvaluating(true);
    
    // Simulate AI evaluation with realistic processing
    setTimeout(() => {
      const wordCount = essayText.trim().split(/\s+/).length;
      const score = Math.min(95, Math.max(60, 75 + Math.random() * 15));
      
      const mockResults = {
        overallScore: score,
        breakdown: {
          grammar: Math.min(100, score + Math.random() * 10),
          structure: Math.min(100, score + Math.random() * 8),
          coherence: Math.min(100, score + Math.random() * 12),
          vocabulary: Math.min(100, score + Math.random() * 10),
          arguments: Math.min(100, score + Math.random() * 15)
        },
        strengths: [
          'Strong thesis statement with clear positioning',
          'Effective use of transitional phrases',
          'Well-developed supporting arguments',
          'Appropriate academic tone maintained throughout'
        ],
        improvements: [
          'Consider adding more specific examples to support main arguments',
          'The conclusion could more explicitly tie back to the thesis',
          'Some sentences are overly complex - simplify for clarity',
          'Add more varied sentence structures for better flow'
        ],
        suggestions: [
          {
            original: 'The impact of technology on education is significant.',
            improved: 'Technology has fundamentally transformed educational methodologies, creating unprecedented opportunities for personalized learning.',
            reason: 'More specific and impactful opening'
          },
          {
            original: 'Many students use computers.',
            improved: 'Contemporary students leverage digital devices as primary tools for research, collaboration, and knowledge acquisition.',
            reason: 'Enhanced vocabulary and precision'
          }
        ],
        wordCount,
        readability: 'College Level',
        estimatedReadTime: Math.ceil(wordCount / 200)
      };

      setResults(mockResults);
      setIsEvaluating(false);
    }, 2500);
  };

  const exportResults = () => {
    if (!results) return;
    
    const exportData = {
      essay: essayText,
      university,
      level: activeTab,
      results,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-ai-evaluation-${Date.now()}.json`;
    a.click();
  };

  const wordCount = essayText.trim().split(/\s+/).filter(w => w).length;
  const charCount = essayText.length;

  return (
    <div className="app-container">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => setShowMenu(!showMenu)} className="menu-toggle">
              {showMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="logo-section">
              <div className="logo-icon">
                <Sparkles size={20} />
              </div>
              <div className="logo-text">
                <h1 className="logo-title">ORBIT</h1>
                <p className="logo-subtitle">AI Essay Assistant</p>
              </div>
            </div>
          </div>

          <div className="header-right">
            <nav className="tab-nav">
              <button
                onClick={() => setActiveTab('undergrad')}
                className={`tab-button ${activeTab === 'undergrad' ? 'active' : ''}`}
              >
                Undergrad
              </button>
              <button
                onClick={() => setActiveTab('mba')}
                className={`tab-button ${activeTab === 'mba' ? 'active' : ''}`}
              >
                MBA
              </button>
            </nav>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="history-button"
            >
              <History size={18} />
              <span>History</span>
            </button>
          </div>
        </div>
      </header>

      {/* History Sidebar */}
      {showHistory && (
        <div className="history-sidebar">
          <div className="history-content">
            <div className="history-header">
              <h3>Saved Essays</h3>
              <button onClick={() => setShowHistory(false)} className="close-button">
                <X size={20} />
              </button>
            </div>
            
            {savedEssays.length === 0 ? (
              <p className="empty-state">No saved essays yet</p>
            ) : (
              <div className="essay-list">
                {savedEssays.map((essay) => (
                  <div key={essay.id} className="essay-item">
                    <div className="essay-item-content" onClick={() => loadEssay(essay)}>
                      <p className="essay-preview">
                        {essay.text.substring(0, 50)}...
                      </p>
                      <div className="essay-meta">
                        <span>{essay.wordCount} words</span>
                        <span>•</span>
                        <span>{new Date(essay.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEssay(essay.id);
                      }}
                      className="delete-button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        <div className="content-grid">
          {/* Left: Essay Input */}
          <div className="input-section">
            <div className="input-card">
              <div className="search-container">
                <div className="search-input-wrapper">
                  <Search className="search-icon" size={20} />
                  <input
                    type="text"
                    placeholder="Search University (optional)"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="textarea-container">
                <textarea
                  placeholder="Type your essay answer here..."
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  className="essay-textarea"
                />
                
                {/* Floating Word Count */}
                <div className="word-count-badge">
                  <p>{wordCount} words • {charCount} characters</p>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  onClick={evaluateEssay}
                  disabled={isEvaluating || !essayText.trim()}
                  className="evaluate-button"
                >
                  {isEvaluating ? (
                    <>
                      <div className="spinner"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      <span>Evaluate with AI</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={saveEssay}
                  disabled={!essayText.trim()}
                  className="save-button"
                >
                  <Save size={20} />
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <BookOpen className="stat-icon stat-icon-purple" size={24} />
                <p className="stat-value">{wordCount}</p>
                <p className="stat-label">Words</p>
              </div>
              <div className="stat-card">
                <TrendingUp className="stat-icon stat-icon-blue" size={24} />
                <p className="stat-value">{results ? Math.round(results.overallScore) : '--'}</p>
                <p className="stat-label">Score</p>
              </div>
              <div className="stat-card">
                <Award className="stat-icon stat-icon-pink" size={24} />
                <p className="stat-value">{savedEssays.length}</p>
                <p className="stat-label">Saved</p>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="results-section">
            <div className="results-card">
              {/* Tab Header */}
              <div className="results-tabs">
                <button
                  onClick={() => setViewMode('feedback')}
                  className={`results-tab ${viewMode === 'feedback' ? 'active' : ''}`}
                >
                  High-Level Feedback
                </button>
                <button
                  onClick={() => setViewMode('edits')}
                  className={`results-tab ${viewMode === 'edits' ? 'active' : ''}`}
                >
                  Specific Edits
                </button>
              </div>

              {/* Results Content */}
              <div className="results-content">
                {!results ? (
                  <div className="empty-results">
                    <div className="empty-icon">
                      <Sparkles size={40} />
                    </div>
                    <h3 className="empty-title">
                      Write your winning essay with AI
                    </h3>
                    <p className="empty-description">
                      Get instant feedback on grammar, structure, coherence, and more. Our AI analyzes your essay and provides actionable suggestions.
                    </p>
                  </div>
                ) : viewMode === 'feedback' ? (
                  <div className="feedback-view">
                    {/* Overall Score */}
                    <div className="score-card">
                      <p className="score-label">Overall Score</p>
                      <div className="score-display">
                        <p className="score-value">{Math.round(results.overallScore)}</p>
                        <p className="score-max">/100</p>
                      </div>
                      <div className="score-bar">
                        <div
                          className="score-bar-fill"
                          style={{ width: `${results.overallScore}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="breakdown-section">
                      <h4 className="section-title">Performance Breakdown</h4>
                      {Object.entries(results.breakdown).map(([key, value]) => (
                        <div key={key} className="breakdown-item">
                          <div className="breakdown-header">
                            <span className="breakdown-label">{key}</span>
                            <span className="breakdown-value">{Math.round(value)}%</span>
                          </div>
                          <div className="breakdown-bar">
                            <div
                              className="breakdown-bar-fill"
                              style={{ width: `${value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Strengths */}
                    <div className="feedback-section">
                      <h4 className="section-title">
                        <Award className="section-icon icon-green" size={20} />
                        Strengths
                      </h4>
                      <div className="feedback-list">
                        {results.strengths.map((strength, idx) => (
                          <div key={idx} className="feedback-item feedback-positive">
                            <ChevronRight className="feedback-icon" size={18} />
                            <p>{strength}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Improvements */}
                    <div className="feedback-section">
                      <h4 className="section-title">
                        <TrendingUp className="section-icon icon-yellow" size={20} />
                        Areas for Improvement
                      </h4>
                      <div className="feedback-list">
                        {results.improvements.map((improvement, idx) => (
                          <div key={idx} className="feedback-item feedback-warning">
                            <ChevronRight className="feedback-icon" size={18} />
                            <p>{improvement}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Export Button */}
                    <button onClick={exportResults} className="export-button">
                      <Download size={20} />
                      <span>Export Results</span>
                    </button>
                  </div>
                ) : (
                  <div className="edits-view">
                    <h4 className="section-title">Suggested Edits</h4>
                    {results.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="suggestion-card">
                        <div className="suggestion-section">
                          <p className="suggestion-label">Original</p>
                          <p className="suggestion-text suggestion-original">
                            {suggestion.original}
                          </p>
                        </div>
                        <div className="suggestion-section">
                          <p className="suggestion-label">Improved</p>
                          <p className="suggestion-text suggestion-improved">
                            {suggestion.improved}
                          </p>
                        </div>
                        <div className="suggestion-reason">
                          <Sparkles className="reason-icon" size={16} />
                          <p>{suggestion.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrbitAI;