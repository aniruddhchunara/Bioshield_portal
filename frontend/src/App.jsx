import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Activity,
  Award,
  BookOpen,
  MessageSquare,
  Bot,
  Plus,
  Check,
  Globe,
  Calendar,
  MapPin,
  AlertTriangle,
  Heart,
  Send,
  Info,
  RefreshCw,
  FileText,
  ChevronRight,
  User,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { translations, surveyQuestions } from './translations';

const API_BASE =
  import.meta.env.DEV
    ? 'http://127.0.0.1:5000/api'
    : 'https://bioshield-portal.onrender.com/api';
export default function App() {
  const [lang, setLang] = useState('en');
  const [species, setSpecies] = useState('Poultry'); // Poultry or Pig
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || '');
  const [authLoading, setAuthLoading] = useState(true);

  // App state
  const [outbreaks, setOutbreaks] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [compliance, setCompliance] = useState({ progress: 0, items: {} });
  const [training, setTraining] = useState({ modules: [], progress: { completedModules: [], scores: {} } });
  const [posts, setPosts] = useState([]);
  const [chatHistory, setChatHistory] = useState([
    { sender: 'assistant', text: "Hello! I am your AI Biosecurity Advisor. Ask me anything about pig or poultry diseases, quarantine regulations, or farm protection guidelines." }
  ]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [aiUsingFallback, setAiUsingFallback] = useState(true);

  // New Post Form State
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', author: '', role: 'Farmer' });

  // New Outbreak Modal
  const [showOutbreakModal, setShowOutbreakModal] = useState(false);
  const [newOutbreak, setNewOutbreak] = useState({ disease: '', region: '', severity: 'High', description: '' });

  // Current Risk Survey State
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [currentSurveyResult, setCurrentSurveyResult] = useState(null);

  // Active Lesson State
  const [activeLessonModule, setActiveLessonModule] = useState(null);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showQuizResult, setShowQuizResult] = useState(false);

  const chatEndRef = useRef(null);
  const t = translations[lang];

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Auth check on mount
 

  // Fetch all initial data
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [species, isAuthenticated]);

  const handleLogin = async () => {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (err) {
    console.error(err);
    alert('Server unreachable');
  }
};

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken('');
    setUser(null);
    setIsAuthenticated(false);
  };

  const fetchAllData = async () => {
    try {
      // Outbreaks
      const outRes = await fetch(`${API_BASE}/outbreaks`);
      if (outRes.ok) setOutbreaks(await outRes.json());

      // Risk Assessments
      const assessRes = await fetch(`${API_BASE}/risk-assessment`);
      if (assessRes.ok) setAssessments(await assessRes.json());

      // Compliance
      const compRes = await fetch(`${API_BASE}/compliance/${species}`);
      if (compRes.ok) setCompliance(await compRes.json());

      // Training Modules
      const trainRes = await fetch(`${API_BASE}/training`);
      if (trainRes.ok) setTraining(await trainRes.json());

      // Community Posts
      const commRes = await fetch(`${API_BASE}/community`);
      if (commRes.ok) setPosts(await commRes.json());

    } catch (e) {
      console.warn("Backend server not running or unreachable. Running on client-side state fallbacks.", e);
      // Fallback local initializations
      setOutbreaks([
        {
          id: 'outbreak-1',
          disease: 'Highly Pathogenic Avian Influenza (H5N1)',
          species: 'Poultry',
          region: 'Northwest District',
          severity: 'Critical',
          date: '2026-06-18',
          description: 'Confirmed case in backyard poultry. Quarantine zones established. Movement restrictions in place within 10km.',
          status: 'Active'
        },
        {
          id: 'outbreak-2',
          disease: 'African Swine Fever (ASF)',
          species: 'Pig',
          region: 'Southern Valley',
          severity: 'High',
          date: '2026-06-12',
          description: 'Spillover detected in smallholder pig farm. Veterinary services monitoring carcass disposal and sanitization.',
          status: 'Active'
        }
      ]);
      setTraining({
        modules: [
          {
            id: 'module-1',
            title: 'Introduction to Swine Biosecurity',
            species: 'Pig',
            duration: '15 mins',
            difficulty: 'Beginner',
            description: 'Learn the three main pillars of biosecurity: segregation, cleaning, and disinfection for pig farming.',
            lessons: [
              'Defining Biosecurity and Transmission Routes',
              'Creating Clean vs. Dirty Zones on Swine Farms',
              'Controlling Visitor and Vehicle Entry Protocols'
            ],
            quiz: [
              {
                question: 'Which of the following is the most common transmitter of African Swine Fever?',
                options: ['Direct contact with infected swine or raw swill feeding', 'Wind and air transmission over 10km', 'Migratory wild waterfowl'],
                answer: 0
              }
            ]
          },
          {
            id: 'module-2',
            title: 'Poultry Disease Prevention (Avian Flu focus)',
            species: 'Poultry',
            duration: '20 mins',
            difficulty: 'Intermediate',
            description: 'Understanding Avian Influenza vectors and how to establish a bird-proof bio-secure shell.',
            lessons: [
              'Understanding Avian Influenza H5N1 Vectors',
              'Constructing a Wild Bird Exclusion System',
              'Water Treatment and Sanitation for Broilers/Layers'
            ],
            quiz: [
              {
                question: 'What is the minimum opening size for netting to prevent wild sparrows from entering poultry houses?',
                options: ['5 cm', 'Less than 2 cm', '10 cm'],
                answer: 1
              }
            ]
          }
        ],
        progress: { completedModules: [], scores: {} }
      });
      setPosts([
        {
          id: 'post-1',
          author: 'Dr. Sarah Mitchell',
          role: 'Veterinarian',
          farmType: 'General',
          avatar: 'SM',
          title: 'Increased Wild Bird Activity - AI Risk Warning',
          content: 'Hello everyone. We are seeing high migration activity of wild waterfowl near the Northwest District reservoirs. Please ensure all poultry feed and water stations are strictly indoors to prevent wild bird contact.',
          timestamp: '2026-06-20T10:30:00Z',
          likes: 12,
          comments: []
        }
      ]);
    }
  };

  // Submit assessment handler
  const handleSurveySubmit = async () => {
    // Check that all questions are answered
    const currentQuestions = surveyQuestions[species];
    const unanswered = currentQuestions.filter(q => !surveyAnswers[q.id]);
    if (unanswered.length > 0) {
      alert("Please answer all questions before submitting.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/risk-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmType: species, answers: surveyAnswers })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSurveyResult(data);
        fetchAllData();
      }
    } catch (e) {
      // Local fallback calculation if backend down
      let score = 0;
      let maxScore = 0;
      const criticalFlaws = [];
      const recommendations = [];

      if (surveyAnswers.fencing === 'yes') score += 15; else criticalFlaws.push('Lack of perimeter fencing allows wild animals access.');
      maxScore += 15;
      if (surveyAnswers.visitors !== 'all') score += 15; else criticalFlaws.push('Unrestricted visitor entry spreads pathogens.');
      maxScore += 15;
      if (surveyAnswers.quarantine === 'yes') score += 15; else criticalFlaws.push('No quarantine area for new animals.');
      maxScore += 15;
      if (surveyAnswers.disinfection === 'yes') score += 15; else criticalFlaws.push('No disinfection footbaths.');
      maxScore += 15;
      if (surveyAnswers.waterSource === 'treated') score += 15; else criticalFlaws.push('Untreated water increases disease entry.');
      maxScore += 15;

      if (species === 'Pig') {
        if (surveyAnswers.swillFeed === 'no') score += 25; else criticalFlaws.push('Swill feeding is highly risky for African Swine Fever.');
        maxScore += 25;
      } else {
        if (surveyAnswers.birdExclusion === 'yes') score += 25; else criticalFlaws.push('No wild bird exclusion mesh.');
        maxScore += 25;
      }

      const scorePercentage = Math.round((score / maxScore) * 100);
      const riskLevel = scorePercentage < 50 ? 'High' : scorePercentage < 80 ? 'Medium' : 'Low';

      const mockResult = {
        id: 'mock-' + Date.now(),
        farmType: species,
        scorePercentage,
        riskLevel,
        criticalFlaws,
        recommendations: ['Install perimeter security', 'Enforce sanitization protocols', 'Use clean feeds'],
        timestamp: new Date().toISOString()
      };

      setCurrentSurveyResult(mockResult);
      setAssessments([mockResult, ...assessments]);
    }
  };

  // Toggle compliance checklist item
  const handleComplianceToggle = async (itemId) => {
    const updatedItems = {
      ...compliance.items,
      [itemId]: !compliance.items[itemId]
    };

    const newProgress = Math.round(
      (Object.values(updatedItems).filter(Boolean).length / 10) * 100
    );

    const updatedCompliance = {
      ...compliance,
      progress: newProgress,
      items: updatedItems
    };

    setCompliance(updatedCompliance);

    try {
      await fetch(`${API_BASE}/compliance/${species}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems, compartmentName: compliance.compartmentName || "Greenwood Farm" })
      });
    } catch (e) {
      console.log("Saving compliance locally because backend is offline");
    }
  };

  // Training completed quiz
  const handleQuizSubmit = async () => {
    const currentQuiz = activeLessonModule.quiz[currentQuizQuestion];
    let isCorrect = selectedQuizOption === currentQuiz.answer;

    let finalScore = quizScore;
    if (isCorrect) {
      finalScore += 100;
    }

    setQuizScore(finalScore);
    setShowQuizResult(true);

    try {
      await fetch(`${API_BASE}/training/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: activeLessonModule.id, score: isCorrect ? 100 : 0 })
      });
      fetchAllData();
    } catch (e) {
      // Local progress save
      const updatedCompleted = [...training.progress.completedModules];
      if (!updatedCompleted.includes(activeLessonModule.id)) {
        updatedCompleted.push(activeLessonModule.id);
      }
      setTraining({
        ...training,
        progress: {
          completedModules: updatedCompleted,
          scores: { ...training.progress.scores, [activeLessonModule.id]: isCorrect ? 100 : 0 }
        }
      });
    }
  };

  // Submit post to Community Board
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) return;

    try {
      const res = await fetch(`${API_BASE}/community`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPost,
          farmType: species,
          avatar: newPost.author.slice(0, 2).toUpperCase() || 'US'
        })
      });
      if (res.ok) {
        const addedPost = await res.json();
        setPosts([addedPost, ...posts]);
        setShowPostModal(false);
        setNewPost({ title: '', content: '', author: '', role: 'Farmer' });
      }
    } catch (e) {
      const mockPost = {
        id: 'post-mock-' + Date.now(),
        author: newPost.author || 'Local Farmer',
        role: newPost.role,
        farmType: species,
        avatar: newPost.author.slice(0, 2).toUpperCase() || 'LF',
        title: newPost.title,
        content: newPost.content,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: []
      };
      setPosts([mockPost, ...posts]);
      setShowPostModal(false);
      setNewPost({ title: '', content: '', author: '', role: 'Farmer' });
    }
  };

  // Report disease outbreak handler
  const handleOutbreakSubmit = async (e) => {
    e.preventDefault();
    if (!newOutbreak.disease || !newOutbreak.region) return;

    try {
      const res = await fetch(`${API_BASE}/outbreaks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newOutbreak, species })
      });
      if (res.ok) {
        const addedOutbreak = await res.json();
        setOutbreaks([addedOutbreak, ...outbreaks]);
        setShowOutbreakModal(false);
        setNewOutbreak({ disease: '', region: '', severity: 'High', description: '' });
      }
    } catch (e) {
      const mockOutbreak = {
        id: 'outbreak-mock-' + Date.now(),
        disease: newOutbreak.disease,
        species,
        region: newOutbreak.region,
        severity: newOutbreak.severity,
        date: new Date().toISOString().split('T')[0],
        description: newOutbreak.description,
        status: 'Active'
      };
      setOutbreaks([mockOutbreak, ...outbreaks]);
      setShowOutbreakModal(false);
      setNewOutbreak({ disease: '', region: '', severity: 'High', description: '' });
    }
  };

  // Upvote Post
  const handleLikePost = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/community/${postId}/like`, { method: 'POST' });
      if (res.ok) {
        const { likes } = await res.json();
        setPosts(posts.map(p => p.id === postId ? { ...p, likes } : p));
      }
    } catch (e) {
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    }
  };

  // Add Comment
  const handleAddComment = async (postId, text) => {
    if (!text.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/community/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: "Me", role: "Expert", content: text })
      });
      if (res.ok) {
        const addedComment = await res.json();
        setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, addedComment] } : p));
      }
    } catch (e) {
      const mockComment = {
        id: 'c-mock-' + Date.now(),
        author: "Me",
        role: "Expert",
        content: text,
        timestamp: new Date().toISOString()
      };
      setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, mockComment] } : p));
    }
  };

  // AI Assistant Chat submit handler
  const handleSendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMsg = { sender: 'user', text: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage, chatHistory: [...chatHistory, userMsg] })
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { sender: 'assistant', text: data.response }]);
        setAiUsingFallback(data.usingFallback);
      }
    } catch (e) {
      // Local matching rules engine
      let reply = "";
      const text = chatMessage.toLowerCase();
      if (text.includes('flu') || text.includes('poultry') || text.includes('bird')) {
        reply = "**[Offline Advisor]** Prevent avian influenza by adding double mesh netting on all poultry roofs and housing, checking that feed is locked away, and sanitizing all boots daily before feeding.";
      } else if (text.includes('swine') || text.includes('pig') || text.includes('asf')) {
        reply = "**[Offline Advisor]** Prevent African Swine Fever by never feeding pigs swill or restaurant waste. Enforce visitor downtime of 48 hours and perimeter double fences.";
      } else {
        reply = "**[Offline Advisor]** Please connect to the internet and start the backend to access our Gemini biosecurity specialist! As a general tip: always sanitize boots, fence your perimeters, and isolate sick pigs/poultry immediately.";
      }
      setChatHistory(prev => [...prev, { sender: 'assistant', text: reply }]);
      setAiUsingFallback(true);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper score color
  const getRiskColor = (level) => {
    if (level === 'High') return 'var(--color-rose)';
    if (level === 'Medium') return 'var(--color-amber)';
    return 'var(--color-emerald)';
  };

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="loading-spinner"></div>
        <p>Verifying credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen onLoginSuccess={(savedToken, userData) => {
        localStorage.setItem('auth_token', savedToken);
        setToken(savedToken);
        setUser(userData);
        setIsAuthenticated(true);
        if (userData.speciesPreference) {
          setSpecies(userData.speciesPreference);
        }
      }} />
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header>
        <div className="logo-section">
          <Shield className="logo-icon" size={28} />
          <div>
            <h1>{t.title}</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '-2px' }}>{t.subtitle}</p>
          </div>
        </div>

        <div className="nav-controls">
          {/* User Profile Info */}
          <div className="user-profile">
            <div className="user-avatar">
              <User size={16} />
            </div>
            <div className="user-details">
              <span className="profile-name">{user?.username}</span>
              <span className="profile-subtitle">{user?.role} • {user?.farmName}</span>
            </div>
            <button className="btn btn-secondary btn-logout" onClick={handleLogout} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
              Logout
            </button>
          </div>

          {/* Species Selector */}
          <div className="species-pill">
            <button
              className={`species-btn ${species === 'Poultry' ? 'active poultry' : ''}`}
              onClick={() => setSpecies('Poultry')}
            >
              🐥 {t.poultry}
            </button>
            <button
              className={`species-btn ${species === 'Pig' ? 'active pig' : ''}`}
              onClick={() => setSpecies('Pig')}
            >
              🐖 {t.pig}
            </button>
          </div>

          {/* Multilingual Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Globe size={18} style={{ color: 'var(--color-text-secondary)' }} />
            <select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">English (EN)</option>
              <option value="sw">Kiswahili (SW)</option>
              <option value="es">Español (ES)</option>
              <option value="vi">Tiếng Việt (VI)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="main-layout">

        {/* Sidebar Nav */}
        <div className="sidebar">
          <div className="nav-links">
            <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <Activity size={20} />
              {t.dashboard}
            </button>
            <button className={`nav-link ${activeTab === 'assessment' ? 'active' : ''}`} onClick={() => setActiveTab('assessment')}>
              <Shield size={20} />
              {t.assessment}
            </button>
            <button className={`nav-link ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveTab('compliance')}>
              <Award size={20} />
              {t.compliance}
            </button>
            <button className={`nav-link ${activeTab === 'academy' ? 'active' : ''}`} onClick={() => setActiveTab('academy')}>
              <BookOpen size={20} />
              {t.academy}
            </button>
            <button className={`nav-link ${activeTab === 'community' ? 'active' : ''}`} onClick={() => setActiveTab('community')}>
              <MessageSquare size={20} />
              {t.communityBoard || t.community}
            </button>
            <button className={`nav-link ${activeTab === 'assistant' ? 'active' : ''}`} onClick={() => setActiveTab('assistant')}>
              <Bot size={20} />
              {t.assistant}
            </button>
          </div>

          <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(59,130,246,0.05)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Info size={14} /> Veterinary Support
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Hotline: <strong>+1-800-BIO-SAFE</strong>
            </p>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="mobile-nav">
          <button className={`mobile-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Activity size={18} />
            <span>{t.dashboard}</span>
          </button>
          <button className={`mobile-nav-link ${activeTab === 'assessment' ? 'active' : ''}`} onClick={() => setActiveTab('assessment')}>
            <Shield size={18} />
            <span>{t.assessment}</span>
          </button>
          <button className={`mobile-nav-link ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveTab('compliance')}>
            <Award size={18} />
            <span>{t.compliance}</span>
          </button>
          <button className={`mobile-nav-link ${activeTab === 'academy' ? 'active' : ''}`} onClick={() => setActiveTab('academy')}>
            <BookOpen size={18} />
            <span>{t.academy}</span>
          </button>
          <button className={`mobile-nav-link ${activeTab === 'community' ? 'active' : ''}`} onClick={() => setActiveTab('community')}>
            <MessageSquare size={18} />
            <span>{t.community}</span>
          </button>
          <button className={`mobile-nav-link ${activeTab === 'assistant' ? 'active' : ''}`} onClick={() => setActiveTab('assistant')}>
            <Bot size={18} />
            <span>{t.assistant}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="content-area">

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="section-header">
                <h2>{t.dashboard}</h2>
                <p>Real-time farm status, biosecurity metrics, and region disease logs.</p>
              </div>

              {/* Stats / Overview Row */}
              <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                {/* Risk Level gauge */}
                <div className="card dashboard-stat-card">
                  <div className="card-title">
                    <Activity size={18} style={{ color: 'var(--color-blue)' }} />
                    {t.riskLevel}
                  </div>
                  <div className="risk-gauge-container">
                    {assessments.length > 0 ? (
                      (() => {
                        const latest = assessments[0];
                        const angle = Math.round((latest.scorePercentage / 100) * 360);
                        const rColor = getRiskColor(latest.riskLevel);
                        return (
                          <>
                            <div className="gauge-ring" style={{ '--score-angle': `${angle}deg`, '--color': rColor }}>
                              <div className="gauge-inner">
                                <div className="gauge-score">{latest.scorePercentage}%</div>
                                <div className="gauge-label" style={{ color: rColor, fontWeight: 700 }}>
                                  {latest.riskLevel === 'Low' ? t.low : latest.riskLevel === 'Medium' ? t.medium : t.high}
                                </div>
                              </div>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                              Latest scan on {new Date(latest.timestamp).toLocaleDateString()}
                            </p>
                          </>
                        );
                      })()
                    ) : (
                      <div style={{ padding: '1rem 0' }}>
                        <AlertTriangle size={36} style={{ color: 'var(--color-amber)', marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>No risk test completed yet.</p>
                        <button className="btn btn-primary" style={{ marginTop: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => setActiveTab('assessment')}>
                          Run Test
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compliance progress */}
                <div className="card dashboard-stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="card-title">
                      <Award size={18} style={{ color: 'var(--color-emerald)' }} />
                      {t.complianceProgress}
                    </div>
                    <div style={{ padding: '0.5rem 0' }}>
                      <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '1.75rem', fontWeight: 800, alignItems: 'baseline' }}>
                        <span>{compliance.progress}%</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: compliance.progress === 100 ? 'var(--color-emerald)' : 'var(--color-blue)' }}>
                          {compliance.progress === 100 ? t.complianceStatusReady : t.complianceStatusProgress}
                        </span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${compliance.progress}%` }}></div>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                        Compartment standards require 100% compliance score for formal departmental inspection.
                      </p>
                    </div>
                  </div>
                  <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto', padding: '0.5rem' }} onClick={() => setActiveTab('compliance')}>
                    Update Checklist
                  </button>
                </div>

                {/* Training completed */}
                <div className="card dashboard-stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="card-title">
                      <BookOpen size={18} style={{ color: 'var(--color-purple)' }} />
                      {t.lessonsCompleted}
                    </div>
                    <div style={{ padding: '0.5rem 0', textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-purple)' }}>
                        {training.progress?.completedModules?.length || 0}
                      </div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Modules Completed</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                        Increase farmer health & safety preparedness with bio-accredited certifications.
                      </p>
                    </div>
                  </div>
                  <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto', padding: '0.5rem' }} onClick={() => setActiveTab('academy')}>
                    Open Academy
                  </button>
                </div>
              </div>

              {/* Active alerts & map */}
              <div className="grid-2">
                <div className="card dashboard-alert-card">
                  <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={18} style={{ color: 'var(--color-rose)' }} />
                      {t.activeAlerts}
                    </div>
                    <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setShowOutbreakModal(true)}>
                      <Plus size={14} /> Report
                    </button>
                  </div>
                  <div className="alert-list">
                    {outbreaks.filter(o => o.species === species || o.species === 'General').map(outbreak => (
                      <div key={outbreak.id} className={`alert-item ${outbreak.severity}`}>
                        <div className="alert-meta">
                          <span className={`severity-badge ${outbreak.severity}`}>{outbreak.severity}</span>
                          <span>{outbreak.date}</span>
                        </div>
                        <div className="alert-title" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <MapPin size={14} style={{ color: 'var(--color-text-secondary)' }} />
                          {outbreak.disease} ({outbreak.region})
                        </div>
                        <div className="alert-description">{outbreak.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card dashboard-map-card">
                  <div className="card-title">
                    <Globe size={18} style={{ color: 'var(--color-blue)' }} />
                    Epidemiological Risk Mapping
                  </div>
                  <div className="dashboard-map-visual" style={{ height: '240px', position: 'relative', overflow: 'hidden' }}>
                    {/* Simulated SVG Grid Map */}
                    <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.15 }}>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="1" />
                      </pattern>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>

                    {/* Glowing containment zones */}
                    <div style={{ position: 'absolute', top: '30%', left: '40%', width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.4)', borderRadius: '50%', boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)', animation: 'pulse 2s infinite' }}></div>
                    <div style={{ position: 'absolute', top: '65%', left: '70%', width: '30px', height: '30px', background: 'rgba(245, 158, 11, 0.4)', borderRadius: '50%', boxShadow: '0 0 15px rgba(245, 158, 11, 0.6)' }}></div>

                    <div style={{ zIndex: 10, textAlign: 'center', padding: '1rem' }}>
                      <MapPin size={32} style={{ color: 'var(--color-blue)', marginBottom: '0.5rem' }} />
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Regional Surveillance Map Activated</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                        Surveillance coordinates synchronized with Department of Livestock Health datasets.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RISK ASSESSMENT */}
          {activeTab === 'assessment' && (
            <div>
              <div className="section-header">
                <h2>{t.assessment}</h2>
                <p>Customize biological hazard screenings for your farm's setup.</p>
              </div>

              <div className="grid-2">
                {/* Survey Questionnaire */}
                <div className="card">
                  <div className="card-title">
                    <Shield size={18} style={{ color: 'var(--color-blue)' }} />
                    {species} Biosecurity Questionnaire
                  </div>

                  <div className="survey-step">
                    {surveyQuestions[species].map((q) => (
                      <div key={q.id} className="question-card">
                        <p className="question-title">{q.question[lang]}</p>
                        <div className="options-grid">
                          {q.options.map((opt) => (
                            <button
                              key={opt.value}
                              className={`option-btn ${surveyAnswers[q.id] === opt.value ? 'selected' : ''}`}
                              onClick={() => setSurveyAnswers({ ...surveyAnswers, [q.id]: opt.value })}
                            >
                              {opt.label[lang]}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={handleSurveySubmit}>
                      Submit Assessment
                    </button>
                  </div>
                </div>

                {/* Live Assessment Results */}
                <div>
                  {currentSurveyResult ? (
                    <div className="card" style={{ borderLeft: `5px solid ${getRiskColor(currentSurveyResult.riskLevel)}` }}>
                      <div className="card-title">
                        Assessment Results
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '3rem', fontWeight: 800 }}>{currentSurveyResult.scorePercentage}%</span>
                        <span style={{ fontWeight: 700, color: getRiskColor(currentSurveyResult.riskLevel) }}>
                          {currentSurveyResult.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>

                      {currentSurveyResult.criticalFlaws?.length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-rose)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                            <AlertTriangle size={16} /> {t.criticalFlaws}
                          </h4>
                          <div className="vulnerability-list">
                            {currentSurveyResult.criticalFlaws.map((flaw, idx) => (
                              <div key={idx} className="vulnerability-item">
                                <div>⚠️</div>
                                <div>{flaw}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentSurveyResult.recommendations?.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                            <Check size={16} /> {t.recommendations}
                          </h4>
                          <div className="vulnerability-list">
                            {currentSurveyResult.recommendations.map((rec, idx) => (
                              <div key={idx} className="recommendation-item">
                                <div>✅</div>
                                <div>{rec}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', borderStyle: 'dashed' }}>
                      <Shield size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
                      <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Submit survey to check farm risk score.</p>
                    </div>
                  )}

                  {/* Assessment History */}
                  <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div className="card-title">
                      {t.assessmentHistory}
                    </div>
                    {assessments.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{t.noAssessments}</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {assessments.map((item) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', alignItems: 'center' }}>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.farmType} Biosecurity Test</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(item.timestamp).toLocaleString()}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontWeight: 700, color: getRiskColor(item.riskLevel) }}>{item.scorePercentage}% Score</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.riskLevel} Risk</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPLIANCE CHECKLIST */}
          {activeTab === 'compliance' && (
            <div>
              <div className="section-header">
                <h2>{t.compliance}</h2>
                <p>National and international standards tracking to achieve disease-free compartment certification.</p>
              </div>

              <div className="grid-2">
                <div className="card">
                  <div className="card-title">
                    <Award size={18} style={{ color: 'var(--color-emerald)' }} />
                    Disease-Free Compartment Recognition Check (FAO/WOAH aligned)
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                    Complete these 10 core checklist standards to prepare for official veterinary audit.
                  </p>

                  <div className="compliance-list">
                    {[
                      { id: 'fencing', title: 'Complete perimeter boundary double fence (no openings)' },
                      { id: 'visitorLog', title: 'Maintain visitor logbooks, clothes downtime rules & protective gear' },
                      { id: 'quarantineArea', title: 'Provide segregated animal quarantine and isolation pens' },
                      { id: 'disinfectionBath', title: 'Implement operational bootbaths and wheel spray at entrance' },
                      { id: 'feedStorageSafe', title: 'Keep all feed locked in rodent-proof silos/sheds' },
                      { id: 'waterTreatment', title: 'Chlorinate, filter, or treat all bird/pig water lines' },
                      { id: 'vetContract', title: 'Enforce scheduled visits from a registered veterinarian' },
                      { id: 'recordKeeping', title: 'Establish complete recording logs for animal mortality and entry/exit' },
                      { id: 'carcassDisposal', title: 'Maintain sanitary, closed carcass disposal units (deep burial or incinerator)' },
                      { id: 'staffTraining', title: 'Document biosecurity induction and protocol training for all farm staff' }
                    ].map((item) => (
                      <div
                        key={item.id}
                        className={`compliance-item ${compliance.items[item.id] ? 'checked' : ''}`}
                        onClick={() => handleComplianceToggle(item.id)}
                      >
                        <div className="checkbox-custom">
                          {compliance.items[item.id] && <Check size={12} />}
                        </div>
                        <span style={{ fontSize: '0.85rem' }}>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <Award size={64} style={{ color: compliance.progress === 100 ? 'var(--color-emerald)' : 'var(--color-text-muted)', filter: compliance.progress === 100 ? 'drop-shadow(0 0 10px rgba(16,185,129,0.3))' : 'none', marginBottom: '1rem' }} />

                  <h3>{compliance.progress === 100 ? "Ready for Department Inspection" : "Accreditation Progress"}</h3>
                  <div style={{ width: '100%', margin: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <span>Current score</span>
                      <span>{compliance.progress}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${compliance.progress}%` }}></div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '350px' }}>
                    {compliance.progress === 100
                      ? "Congratulations! Your farm biosecurity standards align fully with global compartment practices. You may download your certificate profile and request an onsite veterinary department auditor."
                      : `You have completed ${Object.values(compliance.items).filter(Boolean).length} out of 10 items. Complete the remaining steps to request verification.`}
                  </p>

                  {compliance.progress === 100 && (
                    <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => alert("Verification request submitted to the Department of Agriculture.")}>
                      Submit for Accreditation
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACADEMY */}
          {activeTab === 'academy' && (
            <div>
              <div className="section-header">
                <h2>Biosecurity Academy</h2>
                <p>Interactive training modules and certification exams for poultry and pig workers.</p>
              </div>

              {!activeLessonModule ? (
                <div className="module-list">
                  {training.modules?.map((mod) => {
                    const isCompleted = training.progress?.completedModules?.includes(mod.id);
                    return (
                      <div key={mod.id} className="card module-card">
                        <div>
                          <div className="module-meta">
                            <span style={{ background: 'var(--bg-card-hover)', padding: '0.15rem 0.5rem', borderRadius: '0.25rem' }}>{mod.species}</span>
                            <span>{mod.duration}</span>
                            <span>{mod.difficulty}</span>
                          </div>
                          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {mod.title}
                            {isCompleted && <span style={{ color: 'var(--color-emerald)', fontSize: '0.8rem', fontWeight: 600, background: 'var(--color-emerald-bg)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>✓ Passed</span>}
                          </h3>
                          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>{mod.description}</p>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {mod.lessons.map((les, idx) => (
                              <div key={idx} className="lesson-tag">
                                <ChevronRight size={14} style={{ color: 'var(--color-blue)' }} />
                                {les}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <button className="btn btn-primary" onClick={() => {
                            setActiveLessonModule(mod);
                            setCurrentQuizQuestion(0);
                            setSelectedQuizOption(null);
                            setQuizScore(0);
                            setShowQuizResult(false);
                          }}>
                            {isCompleted ? "Re-take Module" : "Start Learning"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <h3>{activeLessonModule.title}</h3>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setActiveLessonModule(null)}>
                      Back to Modules
                    </button>
                  </div>

                  {!showQuizResult ? (
                    <div>
                      <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--color-blue)' }}>Lesson Slides</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {activeLessonModule.lessons.map((les, idx) => (
                            <div key={idx} style={{ padding: '1rem', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
                              <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>Topic {idx + 1}: {les}</p>
                              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                Study guidelines and procedures to minimize viral dissemination inside production buildings. Always execute segregration zones between public traffic and livestock barns.
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--color-amber)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Award size={18} /> Module Quiz
                        </h4>

                        {activeLessonModule.quiz.map((q, idx) => (
                          <div key={idx} className="question-card" style={{ background: 'var(--bg-card)' }}>
                            <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{q.question}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {q.options.map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  className={`option-btn ${selectedQuizOption === oIdx ? 'selected' : ''}`}
                                  onClick={() => setSelectedQuizOption(oIdx)}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}

                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem' }} onClick={handleQuizSubmit}>
                          Submit Quiz
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                      <Award size={64} style={{ color: 'var(--color-emerald)', marginBottom: '1rem' }} />
                      <h2>{t.quizCompleted}</h2>
                      <p style={{ fontSize: '1.1rem', margin: '1rem 0' }}>
                        {t.scoreText}: <strong style={{ color: 'var(--color-emerald)' }}>{quizScore}%</strong>
                      </p>

                      <div style={{ padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '0.75rem', display: 'inline-block', marginBottom: '1.5rem' }}>
                        {quizScore >= 100 ? (
                          <span style={{ color: 'var(--color-emerald)', fontWeight: 700 }}>🏆 {t.pass}!</span>
                        ) : (
                          <span style={{ color: 'var(--color-rose)', fontWeight: 700 }}>❌ {t.fail}.</span>
                        )}
                      </div>

                      <div>
                        <button className="btn btn-primary" onClick={() => {
                          setActiveLessonModule(null);
                        }}>
                          Return to Academy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COMMUNITY BOARD */}
          {activeTab === 'community' && (
            <div>
              <div className="section-header">
                <h2>{t.community}</h2>
                <p>Coordinate local disease maps, report cases, and ask experts questions.</p>
              </div>

              <div className="community-forum">
                <div>
                  <div style={{ display: 'flex', justifycontent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                    <h3>Latest Community Updates</h3>
                    <button className="btn btn-primary" onClick={() => setShowPostModal(true)}>
                      <Plus size={16} /> {t.addPost}
                    </button>
                  </div>

                  {posts.filter(p => p.farmType === species || p.farmType === 'General').map((post) => (
                    <div key={post.id} className="post-card">
                      <div className="post-header">
                        <div className={`avatar-box ${post.role}`}>
                          {post.avatar}
                        </div>
                        <div className="post-meta-info">
                          <span className="post-author">{post.author}</span>
                          <span className="role-badge">{post.role}</span>
                        </div>
                        <span className="post-timestamp">{new Date(post.timestamp).toLocaleDateString()}</span>
                      </div>

                      <h4 className="post-title">{post.title}</h4>
                      <p className="post-content">{post.content}</p>

                      <div className="post-actions">
                        <button className="action-like-btn" onClick={() => handleLikePost(post.id)}>
                          <Heart size={16} /> {post.likes} Likes
                        </button>
                        <button className="action-comment-btn">
                          <MessageSquare size={16} /> {post.comments.length} Comments
                        </button>
                      </div>

                      {/* Comments section */}
                      <div className="post-comments-section">
                        {post.comments.map((comm) => (
                          <div key={comm.id} className="comment-item">
                            <div className="comment-header">
                              <span>{comm.author} ({comm.role})</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                {new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="comment-content">{comm.content}</p>
                          </div>
                        ))}

                        <div className="post-comment-input-area">
                          <input
                            type="text"
                            className="post-comment-input"
                            placeholder="Write a response..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                handleAddComment(post.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right side panel */}
                <div>
                  <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-title">
                      Regional Contacts
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div style={{ padding: '0.5rem', background: 'var(--bg-card-hover)', borderRadius: '0.5rem' }}>
                        <p style={{ fontWeight: 600 }}>District Vet Clinic</p>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Dr. Mitchell: Mitchell@vethealth.gov</p>
                      </div>
                      <div style={{ padding: '0.5rem', background: 'var(--bg-card-hover)', borderRadius: '0.5rem' }}>
                        <p style={{ fontWeight: 600 }}>Agriculture Extension Board</p>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Phone: +1-890-EXT-LINE</p>
                      </div>
                      <div style={{ padding: '0.5rem', background: 'var(--bg-card-hover)', borderRadius: '0.5rem' }}>
                        <p style={{ fontWeight: 600 }}>Outbreak Report Hotline</p>
                        <p style={{ color: 'var(--color-rose)', fontWeight: 600 }}>Emergency: 911-ANIMAL</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AI ASSISTANT */}
          {activeTab === 'assistant' && (
            <div>
              <div className="section-header">
                <h2>{t.assistant}</h2>
                <p>Consult with Gemini artificial intelligence on veterinary biosecurity hazards and diagnoses.</p>
              </div>

              <div className="chat-container">
                <div className="chat-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bot size={20} style={{ color: 'var(--color-blue)' }} />
                    <span style={{ fontWeight: 600 }}>Gemini Veterinary Agent</span>
                  </div>

                  <div className={`chat-status ${aiUsingFallback ? 'fallback' : 'ready'}`}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                    <span>{aiUsingFallback ? t.fallbackAI : t.connectedAI}</span>
                  </div>
                </div>

                <div className="chat-messages">
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.sender}`}>
                      <div style={{ whiteSpace: 'pre-line' }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-message assistant">
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-text-secondary)', animation: 'bounce 1s infinite' }}></div>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-text-secondary)', animation: 'bounce 1s infinite 0.2s' }}></div>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-text-secondary)', animation: 'bounce 1s infinite 0.4s' }}></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="chat-input-area">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder={t.askAssistant}
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  />
                  <button className="btn btn-primary" style={{ padding: '0.75rem' }} onClick={handleSendChatMessage}>
                    <Send size={18} />
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* MODAL 1: NEW COMMUNITY POST */}
      {showPostModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1.25rem' }}>{t.addPost}</h3>

            <form onSubmit={handlePostSubmit}>
              <div className="form-group">
                <label>{t.postTitle}</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.postContent}</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>{t.postAuthor}</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPost.author}
                  onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.postRole}</label>
                <select
                  className="form-select"
                  value={newPost.role}
                  onChange={(e) => setNewPost({ ...newPost, role: e.target.value })}
                >
                  <option value="Farmer">{t.roleFarmer}</option>
                  <option value="Veterinarian">{t.roleVet}</option>
                  <option value="Extension Officer">{t.roleOfficer}</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t.submit}</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPostModal(false)}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REPORT DISEASE OUTBREAK */}
      {showOutbreakModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1.25rem' }}>{t.newOutbreakAlert}</h3>

            <form onSubmit={handleOutbreakSubmit}>
              <div className="form-group">
                <label>{t.diseaseName}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Avian Influenza (H5N1)"
                  value={newOutbreak.disease}
                  onChange={(e) => setNewOutbreak({ ...newOutbreak, disease: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.region}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Southwest Sector"
                  value={newOutbreak.region}
                  onChange={(e) => setNewOutbreak({ ...newOutbreak, region: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.severity}</label>
                <select
                  className="form-select"
                  value={newOutbreak.severity}
                  onChange={(e) => setNewOutbreak({ ...newOutbreak, severity: e.target.value })}
                >
                  <option value="Critical">{t.critical}</option>
                  <option value="High">{t.high}</option>
                  <option value="Medium">{t.medium}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t.description}</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={newOutbreak.description}
                  onChange={(e) => setNewOutbreak({ ...newOutbreak, description: e.target.value })}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t.submit}</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowOutbreakModal(false)}>{t.cancel}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function LoginScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = React.useState(true);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState('Farmer');
  const [farmName, setFarmName] = React.useState('');
  const [speciesPreference, setSpeciesPreference] = React.useState('Poultry');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const body = isLogin
      ? { username: normalizedUsername, password }
      : { username: normalizedUsername, password, role, farmName, speciesPreference };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Server unreachable. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-glass-card">
        <div className="login-logo-section">
          <div className="shield-glow-container">
            <Shield className="login-shield-icon" size={48} />
          </div>
          <h2>BioShield Portal</h2>
          <p>Biosecurity & Compliance Management</p>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); setShowPassword(false); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`login-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); setShowPassword(false); }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error-msg">{error}</div>}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-input password-input"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label>Farm Name</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Greenwood Swine"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="form-select">
                    <option value="Farmer">Farmer</option>
                    <option value="Veterinarian">Veterinarian</option>
                    <option value="Extension Officer">Extension Officer</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Primary Species</label>
                  <select value={speciesPreference} onChange={(e) => setSpeciesPreference(e.target.value)} className="form-select">
                    <option value="Poultry">Poultry 🐥</option>
                    <option value="Pig">Pigs 🐖</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary login-submit-btn" style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

