const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { 
  connectToMongo, 
  loadDatabase, 
  saveDatabase, 
  findUserByUsername, 
  saveUser,
  getDbCollection,
  DB_PATH
} = require('./config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'mysecret123';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes

// 0. Authentication API
app.post('/api/auth/register', async (req, res) => {
  const { username, password, role, farmName, speciesPreference } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: 'user-' + Date.now(),
      username,
      password: hashedPassword,
      role: role || 'Farmer',
      farmName: farmName || 'My Farm',
      speciesPreference: speciesPreference || 'Poultry',
      createdAt: new Date().toISOString()
    };

    await saveUser(newUser);

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password: _, ...userResponse } = newUser;
    res.status(201).json({ token, user: userResponse });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userResponse } = user;
    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserByUsername(decoded.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password: _, ...userResponse } = user;
    res.json(userResponse);
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// 1. Outbreaks API
app.get('/api/outbreaks', (req, res) => {
  const db = loadDatabase();
  res.json(db.outbreaks);
});

app.post('/api/outbreaks', (req, res) => {
  const db = loadDatabase();
  const newOutbreak = {
    id: 'outbreak-' + Date.now(),
    disease: req.body.disease,
    species: req.body.species,
    region: req.body.region,
    severity: req.body.severity,
    date: new Date().toISOString().split('T')[0],
    description: req.body.description,
    status: 'Active'
  };
  db.outbreaks.unshift(newOutbreak);
  saveDatabase(db);
  res.status(201).json(newOutbreak);
});

// 2. Risk Assessment API
app.post('/api/risk-assessment', (req, res) => {
  const { farmType, answers } = req.body;
  
  // Custom biosecurity scoring algorithm
  let maxScore = 0;
  let score = 0;
  const criticalFlaws = [];
  const recommendations = [];

  // Question structure:
  // answers = { fencing: 'yes'|'no', visitors: 'restricted'|'all'|'none', quarantine: 'yes'|'no', swillFeed: 'yes'|'no' (pig only), birdExclusion: 'yes'|'no' (poultry only), disinfection: 'yes'|'no', waterSource: 'treated'|'untreated' }

  if (answers.fencing === 'yes') score += 15; else criticalFlaws.push('Lack of perimeter fencing allows wild animals and stray livestock access to animals.');
  maxScore += 15;

  if (answers.visitors === 'none') {
    score += 15;
  } else if (answers.visitors === 'restricted') {
    score += 10;
  } else {
    criticalFlaws.push('Unrestricted visitor access without logs/sanitization increases disease entry risk.');
  }
  maxScore += 15;

  if (answers.quarantine === 'yes') score += 15; else criticalFlaws.push('No quarantine area for new/sick animals. Pathogens will spread directly to the herd.');
  maxScore += 15;

  if (answers.disinfection === 'yes') score += 15; else criticalFlaws.push('No vehicle or boot disinfection at farm gates.');
  maxScore += 15;

  if (answers.waterSource === 'treated') score += 15; else criticalFlaws.push('Using untreated surface water which can easily carry avian influenza or other pathogens.');
  maxScore += 15;

  if (farmType === 'Pig') {
    if (answers.swillFeed === 'no') {
      score += 25;
    } else {
      criticalFlaws.push('Swill feeding of untreated food waste is a CRITICAL risk factor for African Swine Fever.');
    }
    maxScore += 25;
  } else if (farmType === 'Poultry') {
    if (answers.birdExclusion === 'yes') {
      score += 25;
    } else {
      criticalFlaws.push('No wild bird exclusion netting. Direct contact with migratory birds is highly risky.');
    }
    maxScore += 25;
  }

  const scorePercentage = Math.round((score / maxScore) * 100);
  let riskLevel = 'Low';
  if (scorePercentage < 50) riskLevel = 'High';
  else if (scorePercentage < 80) riskLevel = 'Medium';

  // Build recommendations
  if (answers.fencing !== 'yes') recommendations.push('Install double-perimeter fencing to establish a secure buffer zone.');
  if (answers.visitors === 'all') recommendations.push('Establish a visitor logbook, provide clean boots/coveralls, and enforce a 48-hour downtime.');
  if (answers.quarantine !== 'yes') recommendations.push('Designate a quarantine pen at least 30 meters away from main sheds for new/returned livestock.');
  if (answers.disinfection !== 'yes') recommendations.push('Install footbaths with fresh disinfectant (changed daily) at the entrance of every shed.');
  if (answers.waterSource !== 'treated') recommendations.push('Implement chlorination or UV filtration for all water used by livestock.');
  
  if (farmType === 'Pig' && answers.swillFeed === 'yes') {
    recommendations.push('STRICTLY stop feeding swill/food scraps. Switch to heat-treated commercial feeds or boil scraps for at least 30 minutes at rolling boil.');
  }
  if (farmType === 'Poultry' && answers.birdExclusion !== 'yes') {
    recommendations.push('Install fine wire mesh (less than 2cm openings) on all poultry sheds to keep wild birds out.');
  }

  const assessmentResult = {
    id: 'assessment-' + Date.now(),
    farmType,
    scorePercentage,
    riskLevel,
    criticalFlaws,
    recommendations,
    timestamp: new Date().toISOString(),
    answers
  };

  const db = loadDatabase();
  db.riskAssessments.unshift(assessmentResult);
  saveDatabase(db);

  res.json(assessmentResult);
});

app.get('/api/risk-assessment', (req, res) => {
  const db = loadDatabase();
  res.json(db.riskAssessments);
});

// 3. Regulatory Compliance API
app.get('/api/compliance/:farmType', (req, res) => {
  const db = loadDatabase();
  const farmType = req.params.farmType;
  const recordKey = farmType === 'Pig' ? 'pig-default' : 'poultry-default';
  res.json(db.complianceRecords[recordKey] || { farmType, progress: 0, items: {} });
});

app.post('/api/compliance/:farmType', (req, res) => {
  const db = loadDatabase();
  const farmType = req.params.farmType;
  const recordKey = farmType === 'Pig' ? 'pig-default' : 'poultry-default';
  
  const { items, compartmentName } = req.body;
  
  // Calculate progress percentage
  const total = Object.keys(items).length;
  const completed = Object.values(items).filter(Boolean).length;
  const progress = Math.round((completed / total) * 100);

  db.complianceRecords[recordKey] = {
    compartmentName: compartmentName || db.complianceRecords[recordKey]?.compartmentName || 'My Farm',
    farmType,
    progress,
    items
  };

  saveDatabase(db);
  res.json(db.complianceRecords[recordKey]);
});

// 4. Community Board API
app.get('/api/community', (req, res) => {
  const db = loadDatabase();
  res.json(db.communityPosts);
});

app.post('/api/community', (req, res) => {
  const db = loadDatabase();
  const newPost = {
    id: 'post-' + Date.now(),
    author: req.body.author || 'Anonymous Farmer',
    role: req.body.role || 'Farmer',
    farmType: req.body.farmType || 'General',
    avatar: req.body.avatar || 'farmer-default',
    title: req.body.title,
    content: req.body.content,
    timestamp: new Date().toISOString(),
    likes: 0,
    comments: []
  };
  db.communityPosts.unshift(newPost);
  saveDatabase(db);
  res.status(201).json(newPost);
});

app.post('/api/community/:postId/like', (req, res) => {
  const db = loadDatabase();
  const post = db.communityPosts.find(p => p.id === req.params.postId);
  if (post) {
    post.likes += 1;
    saveDatabase(db);
    res.json({ likes: post.likes });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

app.post('/api/community/:postId/comment', (req, res) => {
  const db = loadDatabase();
  const post = db.communityPosts.find(p => p.id === req.params.postId);
  if (post) {
    const newComment = {
      id: 'comment-' + Date.now(),
      author: req.body.author || 'Anonymous Vet',
      role: req.body.role || 'Expert',
      content: req.body.content,
      timestamp: new Date().toISOString()
    };
    post.comments.push(newComment);
    saveDatabase(db);
    res.status(201).json(newComment);
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

// 5. Training API
app.get('/api/training', (req, res) => {
  // Modules configuration
  const modules = [
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
    },
    {
      id: 'module-3',
      title: 'Disinfectant Choice and Footbath Management',
      species: 'General',
      duration: '10 mins',
      difficulty: 'Beginner',
      description: 'Choosing the correct chemical active ingredient for viruses vs bacteria, and proper dilution.',
      lessons: [
        'Types of Disinfectants and Contact Times',
        'Why Dirt Deactivates Disinfectants (Cleaning first)',
        'Managing Footbaths and Vehicle Sprays Daily'
      ],
      quiz: [
        {
          question: 'Why must boots be washed clean of organic matter (dirt/manure) before stepping into a disinfectant bath?',
          options: ['Organic matter deactivates most disinfectants and shields pathogens', 'It is only for visual neatness', 'To prevent chemical stains on boots'],
          answer: 0
        }
      ]
    }
  ];
  
  const db = loadDatabase();
  res.json({
    modules,
    progress: db.trainingProgress['user-default'] || { completedModules: [], scores: {} }
  });
});

app.post('/api/training/complete', (req, res) => {
  const { moduleId, score } = req.body;
  const db = loadDatabase();
  
  if (!db.trainingProgress['user-default']) {
    db.trainingProgress['user-default'] = { completedModules: [], scores: {} };
  }
  
  if (!db.trainingProgress['user-default'].completedModules.includes(moduleId)) {
    db.trainingProgress['user-default'].completedModules.push(moduleId);
  }
  
  db.trainingProgress['user-default'].scores[moduleId] = score;
  saveDatabase(db);
  
  res.json(db.trainingProgress['user-default']);
});

// 6. AI Assistant API (with smart fallback rules engine)
app.post('/api/assistant', async (req, res) => {
  const { message, chatHistory } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    // Smart local biosecurity rules engine fallback
    const text = message.toLowerCase();
    let reply = "";

    if (text.includes('flu') || text.includes('poultry') || text.includes('bird') || text.includes('chicken')) {
      reply = "💡 **[AI Assistant Fallback - Local Rules Engine Activated]**\n\nFor **Poultry Biosecurity / Avian Influenza**:\n1. **Containment**: Keep all poultry feed, water, and birds in completely closed sheds with fine wire netting (<2cm mesh) to prevent wild bird contact.\n2. **Disinfection**: Enforce boot-washing and sanitization for anyone entering. Change disinfectant daily.\n3. **Water**: Ensure all drinking water is sourced from treated borewells or chlorinated, not open ponds accessible to wild waterfowl.";
    } else if (text.includes('swine') || text.includes('pig') || text.includes('asf') || text.includes('fever')) {
      reply = "💡 **[AI Assistant Fallback - Local Rules Engine Activated]**\n\nFor **Swine Biosecurity / African Swine Fever (ASF)**:\n1. **NO Swill Feeding**: African Swine Fever is heavily transmitted by swill (food waste). Stop swill feeding immediately; use cooked grains or dry commercial feed.\n2. **Fencing**: Double fence your pig perimeter. Keep stray pigs and feral boars away from contact.\n3. **Downtime**: Anyone visiting the pigs must have had at least 48 hours of downtime since touching other pigs.";
    } else if (text.includes('disinfect') || text.includes('footbath') || text.includes('clean')) {
      reply = "💡 **[AI Assistant Fallback - Local Rules Engine Activated]**\n\nFor **Cleaning & Disinfection Protocols**:\n- **Clean First**: Disinfectants cannot penetrate dirt or manure. Wash all surfaces with clean water and detergent *before* spraying disinfectant.\n- **Contact Time**: Disinfectants require a minimum contact time (usually 10-20 minutes) to kill pathogens. Do not rinse them off immediately.\n- **Footbaths**: Ensure footbaths have dilution rates matching the target virus (e.g. virkon, glutaraldehyde) and change the solution when muddy.";
    } else {
      reply = "💡 **[AI Assistant Fallback - Local Rules Engine Activated]**\n\nThank you for reaching out! To enable my full capabilities (including diagnostic scans, localized weather/epidemiology risk mapping, and personalized solutions), **please add your Gemini API Key in the backend `.env` file**.\n\nHere are some core biosecurity rules to keep in mind:\n- Maintain strict perimeter fences.\n- Log and sanitize all visitors.\n- Quarantine new livestock for at least 21 days.\n- Do not feed food scraps (swill) to pigs.";
    }
    
    return res.json({ response: reply, usingFallback: true });
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Format chat history for Gemini API
    const contents = [];
    let expectedRole = 'user';

    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach(msg => {
        const msgRole = msg.sender === 'user' ? 'user' : 'model';
        if (msgRole === expectedRole) {
          contents.push({
            role: msgRole,
            parts: [{ text: msg.text }]
          });
          expectedRole = expectedRole === 'user' ? 'model' : 'user';
        }
      });
    }

    // Add instructions to guide Gemini for animal biosecurity
    const promptContext = `You are a specialist veterinary biosecurity advisor for poultry and pig production.
A farmer or extension worker is asking a question: "${message}".
Please provide a practical, action-oriented, and easy-to-understand response.
Use bullet points, clear headings, and highlight critical warnings (such as avoiding swill feeding for pigs, or netting for wild bird exclusion in poultry).
Keep formatting clean and readable on mobile screens.`;

    if (expectedRole === 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: promptContext }]
      });
    } else {
      // Replace the last user message with the enriched one
      if (contents.length > 0) {
        contents[contents.length - 1] = {
          role: 'user',
          parts: [{ text: promptContext }]
        };
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: promptContext }]
        });
      }
    }

    const result = await model.generateContent({ contents });
    const responseText = result.response.text();
    
    res.json({ response: responseText, usingFallback: false });
  } catch (error) {
    console.error('Error generating content from Gemini API:', error);
    res.status(500).json({ error: 'AI Assistant failed to generate a response. Please check your API Key configuration.' });
  }
});

// Serve static assets from frontend build if available
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Start Server after connecting to MongoDB
connectToMongo().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (!getDbCollection()) {
      console.log(`Running on local fallback database.json at ${DB_PATH}`);
    }
  });
});
