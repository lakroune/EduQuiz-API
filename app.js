const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

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