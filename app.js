const express = require('express');
const path = require('path');
const crypto = require('crypto'); 
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'template')));

// ─── MongoDB ──────────────────────────────────────────────────
let isConnected = false;

async function connectDB() {
    if (isConnected) return;
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('Connected to MongoDB');
}

// Middleware: connect DB avant chaque requête
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ message: 'DB connection failed', error: err.message });
    }
});

const Question = require('./models/Question');

// ─── Routes ──────────────────────────────────────────────────

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'admin.html'));
});

// GET all questions
app.get('/questions', async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching data from MongoDB', error: err.message });
    }
});

// POST new question
app.post('/questions', async (req, res) => {
    try {
        const { question, options, correctAnswer } = req.body;
        const newQuestion = new Question({ question, options, correctAnswer });
        const savedQuestion = await newQuestion.save();
        res.status(201).json({
            message: 'Question added to MongoDB!',
            question: savedQuestion
        });
    } catch (err) {
        res.status(400).json({ message: 'Error saving to database', error: err.message });
    }
});

// GET random question
app.get('/quiz/random', async (req, res) => {
    try {
        const count = await Question.countDocuments();
        if (count === 0) {
            return res.status(404).json({ message: 'No questions found!' });
        }

        const randomIndex = crypto.randomInt(0, count);
        const randomQuestion = await Question.findOne().skip(randomIndex);

        const { correctAnswer, ...questionWithoutAnswer } = randomQuestion.toObject();
        res.json(questionWithoutAnswer);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching random question', error: err.message });
    }
});

// POST check answer
app.post('/quiz/check', async (req, res) => {
    try {
        const { questionId, userAnswer } = req.body;
        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({ message: 'Question not found!' });
        }

        const isCorrect = question.correctAnswer === userAnswer;
        res.json({
            correct: isCorrect,
            message: isCorrect ? 'Correct answer!' : 'Incorrect answer!',
            correctAnswerIndex: isCorrect ? null : question.correctAnswer
        });
    } catch (err) {
        res.status(500).json({ message: 'Error checking answer', error: err.message });
    }
});

// DELETE question
app.delete('/questions/:id', async (req, res) => {
    try {
        const deletedQuestion = await Question.findByIdAndDelete(req.params.id);
        if (!deletedQuestion) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json({ message: 'Question deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting question', error: err.message });
    }
});

// PUT update question
app.put('/questions/:id', async (req, res) => {
    try {
        const { question, options, correctAnswer } = req.body;
        const updatedQuestion = await Question.findByIdAndUpdate(
            req.params.id,
            { question, options, correctAnswer },
            { new: true, runValidators: true }
        );
        if (!updatedQuestion) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json({
            message: 'Question updated successfully',
            updatedQuestion
        });
    } catch (err) {
        res.status(500).json({ message: 'Error updating question', error: err.message });
    }
});

// ─── Start server   ───────────
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;