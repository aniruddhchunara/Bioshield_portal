const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.json');

let dbState = null;
let dbCollection = null;
let mongoClient = null;

const initialDatabase = {
  outbreaks: [
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
    },
    {
      id: 'outbreak-3',
      disease: 'Foot and Mouth Disease (FMD)',
      species: 'Pig',
      region: 'Central Plains',
      severity: 'Medium',
      date: '2026-05-28',
      description: 'Control vaccination campaign launched. Outbreak contained, awaiting clearance.',
      status: 'Contained'
    }
  ],
  riskAssessments: [],
  complianceRecords: {
    'poultry-default': {
      compartmentName: 'Greenwood Poultry Farm',
      farmType: 'Poultry',
      progress: 65,
      items: {
        fencing: true,
        visitorLog: true,
        quarantineArea: true,
        disinfectionBath: false,
        feedStorageSafe: true,
        waterTreatment: false,
        vetContract: true,
        recordKeeping: true,
        carcassDisposal: false,
        staffTraining: false
      }
    },
    'pig-default': {
      compartmentName: 'Sunny Hills Swine',
      farmType: 'Pig',
      progress: 40,
      items: {
        fencing: true,
        visitorLog: false,
        quarantineArea: true,
        disinfectionBath: false,
        feedStorageSafe: false,
        waterTreatment: false,
        vetContract: true,
        recordKeeping: false,
        carcassDisposal: false,
        staffTraining: false
      }
    }
  },
  communityPosts: [
    {
      id: 'post-1',
      author: 'Dr. Sarah Mitchell',
      role: 'Veterinarian',
      farmType: 'General',
      avatar: 'vet-1',
      title: 'Increased Wild Bird Activity - AI Risk Warning',
      content: 'Hello everyone. We are seeing high migration activity of wild waterfowl near the Northwest District reservoirs. Please ensure all poultry feed and water stations are strictly indoors to prevent wild bird contact.',
      timestamp: '2026-06-20T10:30:00Z',
      likes: 12,
      comments: [
        {
          id: 'c-1',
          author: 'John Farmer',
          role: 'Poultry Farmer',
          content: 'Thank you Dr. Mitchell. Just double-checked our netting today.',
          timestamp: '2026-06-20T11:15:00Z'
        }
      ]
    },
    {
      id: 'post-2',
      author: 'Carlos Gomez',
      role: 'Extension Officer',
      farmType: 'Pig',
      avatar: 'ext-1',
      title: 'Swill Feeding Prohibitions reminder',
      content: 'Reminder to all swine owners: swill feeding (feeding food scraps/waste to pigs) is the main vector for African Swine Fever. Feed only commercial pellets or cooked plant-based feed that has not touched meat.',
      timestamp: '2026-06-19T14:20:00Z',
      likes: 8,
      comments: []
    }
  ],
  trainingProgress: {
    'user-default': {
      completedModules: ['module-1'],
      scores: { 'module-1': 100 }
    }
  }
};

async function connectToMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('MONGO_URI is not set in environment. Using local database.json fallback.');
    return false;
  }
  try {
    console.log('Connecting to MongoDB...');
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    const db = mongoClient.db('biosecurity');
    dbCollection = db.collection('portal_state');
    
    const doc = await dbCollection.findOne({});
    if (doc) {
      const { _id, ...cleanDoc } = doc;
      dbState = cleanDoc;
      console.log('MongoDB connected successfully and state loaded.');
    } else {
      console.log('No state found in MongoDB. Seeding initial data...');
      await dbCollection.insertOne({ ...initialDatabase });
      dbState = { ...initialDatabase };
    }
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.log('Falling back to local database.json file.');
    return false;
  }
}

function loadDatabase() {
  if (dbState) {
    return dbState;
  }
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDatabase, null, 2));
      dbState = { ...initialDatabase };
      return initialDatabase;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    dbState = JSON.parse(data);
    return dbState;
  } catch (error) {
    console.error('Error reading database file, returning mock data:', error);
    return initialDatabase;
  }
}

function saveDatabase(db) {
  dbState = db;
  if (dbCollection) {
    const { _id, ...updateData } = db;
    dbCollection.updateOne({}, { $set: updateData }, { upsert: true })
      .catch(error => {
        console.error('Error saving state to MongoDB:', error);
      });
  } else {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (error) {
      console.error('Error saving database file:', error);
    }
  }
}

async function findUserByUsername(username) {
  if (dbCollection) {
    const db = mongoClient.db('biosecurity');
    const userCollection = db.collection('users');
    return await userCollection.findOne({ username });
  } else {
    const db = loadDatabase();
    if (!db.users) db.users = [];
    return db.users.find(u => u.username === username);
  }
}

async function saveUser(user) {
  if (dbCollection) {
    const db = mongoClient.db('biosecurity');
    const userCollection = db.collection('users');
    await userCollection.insertOne(user);
  } else {
    const db = loadDatabase();
    if (!db.users) db.users = [];
    db.users.push(user);
    saveDatabase(db);
  }
}

module.exports = {
  connectToMongo,
  loadDatabase,
  saveDatabase,
  findUserByUsername,
  saveUser,
  getDbCollection: () => dbCollection,
  getMongoClient: () => mongoClient,
  DB_PATH
};
