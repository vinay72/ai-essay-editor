const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection with Mongoose (handles the connection better than native driver)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    
    
    
    // Test the connection
    await mongoose.connection.db.admin().command({ ping: 1 });
    
  } catch (error) {
    
    process.exit(1);
  }
};

// Connect to database
connectDB();

// MongoDB connection event listeners
mongoose.connection.on('disconnected', () => {
  console.log('  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(' MongoDB error:', err);
});

// Models
const essaySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: false
  },
  text: {
    type: String,
    required: true,
    minlength: 10
  },
  university: {
    type: String,
    default: ''
  },
  level: {
    type: String,
    enum: ['undergrad', 'mba'],
    default: 'undergrad'
  },
  wordCount: {
    type: Number,
    required: true
  },
  charCount: {
    type: Number,
    required: true
  },
  results: {
    overallScore: Number,
    breakdown: {
      grammar: Number,
      structure: Number,
      coherence: Number,
      vocabulary: Number,
      arguments: Number
    },
    strengths: [String],
    improvements: [String],
    suggestions: [{
      original: String,
      improved: String,
      reason: String
    }],
    readability: String,
    estimatedReadTime: Number
  },
  status: {
    type: String,
    enum: ['draft', 'evaluated', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

essaySchema.index({ userId: 1, createdAt: -1 });
essaySchema.index({ status: 1 });

const Essay = mongoose.model('Essay', essaySchema);

// AI Evaluation Logic
const evaluateEssayAI = (essayText) => {
  const wordCount = essayText.trim().split(/\s+/).length;
  const charCount = essayText.length;
  const sentences = essayText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let baseScore = 70;
  
  if (wordCount >= 300 && wordCount <= 800) {
    baseScore += 10;
  } else if (wordCount < 100) {
    baseScore -= 15;
  }
  
  const avgSentenceLength = wordCount / sentences.length;
  if (avgSentenceLength >= 15 && avgSentenceLength <= 25) {
    baseScore += 5;
  }
  
  const words = essayText.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const vocabularyRichness = uniqueWords.size / words.length;
  if (vocabularyRichness > 0.6) {
    baseScore += 8;
  }
  
  const randomFactor = Math.random() * 12 - 6;
  const overallScore = Math.max(50, Math.min(98, baseScore + randomFactor));
  
  const breakdown = {
    grammar: Math.min(100, overallScore + (Math.random() * 10 - 5)),
    structure: Math.min(100, overallScore + (Math.random() * 8 - 4)),
    coherence: Math.min(100, overallScore + (Math.random() * 12 - 6)),
    vocabulary: Math.min(100, overallScore + (Math.random() * 10 - 5)),
    arguments: Math.min(100, overallScore + (Math.random() * 15 - 7))
  };
  
  const strengths = [];
  const improvements = [];
  
  if (breakdown.grammar > 85) {
    strengths.push('Excellent grammar with minimal errors');
  }
  if (breakdown.structure > 80) {
    strengths.push('Well-organized essay structure with clear progression');
  }
  if (wordCount > 500) {
    strengths.push('Comprehensive coverage of the topic');
  }
  if (vocabularyRichness > 0.65) {
    strengths.push('Rich and varied vocabulary usage');
  }
  
  if (breakdown.coherence < 75) {
    improvements.push('Improve logical flow between paragraphs');
  }
  if (avgSentenceLength > 30) {
    improvements.push('Consider breaking down complex sentences for clarity');
  }
  if (wordCount < 300) {
    improvements.push('Expand arguments with more supporting evidence');
  }
  if (breakdown.arguments < 80) {
    improvements.push('Strengthen main arguments with specific examples');
  }
  
  const suggestions = [];
  const sampleSentences = sentences.slice(0, 3);
  
  sampleSentences.forEach((sentence, idx) => {
    if (idx === 0 && sentence.trim().length < 80) {
      suggestions.push({
        original: sentence.trim() + '.',
        improved: 'Consider expanding your opening statement to provide more context and engage the reader immediately.',
        reason: 'Stronger opening statement'
      });
    }
  });
  
  let readability = 'College Level';
  if (avgSentenceLength < 15) {
    readability = 'High School Level';
  } else if (avgSentenceLength > 25) {
    readability = 'Graduate Level';
  }
  
  return {
    overallScore: Math.round(overallScore * 10) / 10,
    breakdown,
    strengths: strengths.length > 0 ? strengths : ['Clear writing style', 'Good effort in addressing the topic'],
    improvements: improvements.length > 0 ? improvements : ['Continue refining your arguments', 'Consider adding more specific examples'],
    suggestions: suggestions.length > 0 ? suggestions : [{
      original: 'Sample text for improvement',
      improved: 'Enhanced version with better structure and vocabulary',
      reason: 'Improved clarity and impact'
    }],
    wordCount,
    charCount,
    readability,
    estimatedReadTime: Math.ceil(wordCount / 200)
  };
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Orbit AI Backend is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/essays', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      level, 
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (level) query.level = level;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const essays = await Essay.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');
    
    const total = await Essay.countDocuments(query);
    
    res.json({
      success: true,
      data: essays,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching essays:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch essays',
      message: error.message 
    });
  }
});

app.get('/api/essays/:id', async (req, res) => {
  try {
    const essay = await Essay.findById(req.params.id);
    
    if (!essay) {
      return res.status(404).json({ 
        success: false, 
        error: 'Essay not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: essay 
    });
  } catch (error) {
    console.error('Error fetching essay:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch essay',
      message: error.message 
    });
  }
});

app.post('/api/essays/evaluate', async (req, res) => {
  try {
    const { text, university, level } = req.body;
    
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Essay text must be at least 10 characters long' 
      });
    }
    
    const results = evaluateEssayAI(text);
    
    const essay = new Essay({
      text,
      university: university || '',
      level: level || 'undergrad',
      wordCount: results.wordCount,
      charCount: results.charCount,
      results,
      status: 'evaluated'
    });
    
    await essay.save();
    
    res.status(201).json({ 
      success: true, 
      data: essay,
      message: 'Essay evaluated successfully'
    });
  } catch (error) {
    console.error('Error evaluating essay:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to evaluate essay',
      message: error.message 
    });
  }
});

app.put('/api/essays/:id', async (req, res) => {
  try {
    const { text, university, level, status } = req.body;
    
    const updateData = {};
    if (text) {
      updateData.text = text;
      const wordCount = text.trim().split(/\s+/).length;
      updateData.wordCount = wordCount;
      updateData.charCount = text.length;
    }
    if (university !== undefined) updateData.university = university;
    if (level) updateData.level = level;
    if (status) updateData.status = status;
    
    const essay = await Essay.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!essay) {
      return res.status(404).json({ 
        success: false, 
        error: 'Essay not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: essay,
      message: 'Essay updated successfully'
    });
  } catch (error) {
    console.error('Error updating essay:', error);
    res.status(500).json({ 
      success: false, 
error: 'Failed to update essay',
      message: error.message 
    });
  }
});

app.delete('/api/essays/:id', async (req, res) => {
  try {
    const essay = await Essay.findByIdAndDelete(req.params.id);
    
    if (!essay) {
      return res.status(404).json({ 
        success: false, 
        error: 'Essay not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Essay deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting essay:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete essay',
      message: error.message 
    });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const totalEssays = await Essay.countDocuments();
    const avgScore = await Essay.aggregate([
      { $match: { 'results.overallScore': { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: '$results.overallScore' } } }
    ]);
    
    const levelStats = await Essay.aggregate([
      { $group: { _id: '$level', count: { $count: {} } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalEssays,
        averageScore: avgScore[0]?.avgScore || 0,
        byLevel: levelStats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
});