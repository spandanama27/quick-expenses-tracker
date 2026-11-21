const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'expenses.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Read expenses from JSON file
function readExpenses() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return data ? JSON.parse(data) : [];
}

// Helper: Save expenses to JSON file
function saveExpenses(expenses) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
}

// 1. GET all expenses (with optional ?category=Food filter)
app.get('/api/expenses', (req, res) => {
  let expenses = readExpenses();
  if (req.query.category && req.query.category !== 'All') {
    expenses = expenses.filter(
      (e) => e.category.toLowerCase() === req.query.category.toLowerCase()
    );
  }
  res.json(expenses.reverse()); // Newest first
});

// 2. POST a new expense
app.post('/api/expenses', (req, res) => {
  const { title, amount, category } = req.body;
  if (!title || !amount || !category) {
    return res.status(400).json({ error: 'title, amount, and category are required' });
  }

  const expenses = readExpenses();
  const newExpense = {
    id: Date.now().toString(),
    title: title.trim(),
    amount: Number(amount),
    category,
    date: new Date().toISOString().split('T')[0],
  };

  expenses.push(newExpense);
  saveExpenses(expenses);
  res.status(201).json(newExpense);
});

// 3. DELETE an expense by ID
app.delete('/api/expenses/:id', (req, res) => {
  const expenses = readExpenses();
  const filtered = expenses.filter((e) => e.id !== req.params.id);

  if (filtered.length === expenses.length) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  saveExpenses(filtered);
  res.json({ message: 'Expense deleted' });
});

// 4. GET spending summary
app.get('/api/summary', (req, res) => {
  const expenses = readExpenses();
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  res.json({ totalSpent, count: expenses.length, byCategory });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});