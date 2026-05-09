const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
const { v4: uuidv4 } = require('uuid');
app.use(express.json());

const questionsPath = path.join(__dirname, 'data', 'questions.json');

app.get('/questions', (req, res) => {
    try {
        const data = fs.readFileSync(questionsPath, 'utf8');
        const questions = JSON.parse(data);
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: "Error reading data" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.post('/questions', (req, res) => {
    try {
        const { question, options, correctAnswer } = req.body;

        const data = fs.readFileSync(questionsPath, 'utf8');
        const questions = JSON.parse(data);

        const newQuestion = {
            id: uuidv4(), 
            question,
            options,
            correctAnswer
        };

        questions.push(newQuestion);
        fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));

        res.status(201).json({ message: "Question added!", question: newQuestion });
    } catch (err) {
        res.status(500).json({ message: "Error saving data" });
    }
});
app.get('/quiz/random', (req, res) => {
    try {
        const data = fs.readFileSync(questionsPath, 'utf8');
        const questions = JSON.parse(data);

        if (questions.length === 0) {
            return res.status(404).json({ message: "No questions found!" });
        }

        const randomIndex = Math.floor(Math.random() * questions.length);
        const randomQuestion = questions[randomIndex];

        const { correctAnswer, ...questionWithoutAnswer } = randomQuestion;
        res.json(questionWithoutAnswer);
    } catch (err) {
        res.status(500).json({ message: "Error fetching random question" });
    }
});

app.post('/quiz/check', (req, res) => {
    try {
        const { questionId, userAnswer } = req.body;

        const data = fs.readFileSync(questionsPath, 'utf8');
        const questions = JSON.parse(data);

        const question = questions.find(q => q.id === questionId);

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
        res.status(500).json({ message: "Error checking answer" });
    }
});


app.delete('/questions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = fs.readFileSync(questionsPath, 'utf8');
        let questions = JSON.parse(data);

        const newQuestions = questions.filter(q => q.id !== id);

        if (questions.length === newQuestions.length) {
            return res.status(404).json({ message: "question not found" });
        }

        fs.writeFileSync(questionsPath, JSON.stringify(newQuestions, null, 2));
        res.json({ message: "the question deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting question" });
    }
});

app.put('/questions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { question, options, correctAnswer } = req.body;
        
        const data = fs.readFileSync(questionsPath, 'utf8');
        let questions = JSON.parse(data);

        const index = questions.findIndex(q => q.id === id);

        if (index === -1) {
            return res.status(404).json({ message: "question not found" });
        }

        questions[index] = { ...questions[index], question, options, correctAnswer };

        fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));
        res.json({ message: "the question updated successfully", updatedQuestion: questions[index] });
    } catch (err) {
        res.status(500).json({ message: "Error updating question" });
    }
});