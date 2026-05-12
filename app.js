const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
app.use(cors());
const mongoose = require('mongoose');
const Question = require('./models/Question')


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to Dockhosting MongoDB '))
    .catch(err => console.error('Connection error :', err));

app.use(express.json());


app.use(express.static(path.join(__dirname, 'template')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'admin.html'));
});

const questionsPath = path.join(__dirname, 'data', 'questions.json');

app.get('/questions', async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: "Error fetching data from MongoDB", error: err.message });
    }
});



app.post('/questions', async (req, res) => {
    try {
        const { question, options, correctAnswer } = req.body;
        const newQuestion = new Question({
            question,
            options,
            correctAnswer
        });
        const savedQuestion = await newQuestion.save();
        res.status(201).json({
            message: "Question added to MongoDB!",
            question: savedQuestion
        });
    } catch (err) {
        res.status(400).json({ message: "Error saving to database", error: err.message });
    }
});


app.get('/quiz/random', async (req, res) => {
    try {
        const count = await Question.countDocuments();
        if (count === 0) {
            return res.status(404).json({ message: "No questions found!" });
        }

        const randomIndex = Math.floor(Math.random() * count);
        const randomQuestion = await Question.findOne().skip(randomIndex);

        const { correctAnswer, ...questionWithoutAnswer } = randomQuestion.toObject();
        res.json(questionWithoutAnswer);
    } catch (err) {
        res.status(500).json({ message: "Error fetching random question", error: err.message });
    }
});
app.post('/quiz/check', async (req, res) => {
    try {
        const { questionId, userAnswer } = req.body;

        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({ message: "Question not found!" });
        }

        const isCorrect = question.correctAnswer === userAnswer;

        res.json({
            correct: isCorrect,
            message: isCorrect ? "Correct answer!" : "Incorrect answer!",
            correctAnswerIndex: isCorrect ? null : question.correctAnswer
        });
    } catch (err) {
        res.status(500).json({ message: "Error checking answer", error: err.message });
    }
});
app.delete('/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedQuestion = await Question.findByIdAndDelete(id);

        if (!deletedQuestion) {
            return res.status(404).json({ message: "question not found" });
        }

        res.json({ message: "the question deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting question", error: err.message });
    }
}); app.put('/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { question, options, correctAnswer } = req.body;

        const updatedQuestion = await Question.findByIdAndUpdate(
            id,
            { question, options, correctAnswer },
            { new: true, runValidators: true }
        );

        if (!updatedQuestion) {
            return res.status(404).json({ message: "question not found" });
        }

        res.json({
            message: "the question updated successfully",
            updatedQuestion
        });
    } catch (err) {
        res.status(500).json({ message: "Error updating question", error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;