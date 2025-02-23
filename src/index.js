import express from 'express';
import session from 'express-session';
import methodOverride from 'method-override';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import moment from 'moment';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(join(__dirname, 'public')));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Local storage for expenses (in a real app, this would be a database)
let expenses = [];

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Routes
app.get('/', (req, res) => {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categories = [...new Set(expenses.map(exp => exp.category))];
  const categoryTotals = categories.map(cat => ({
    category: cat,
    total: expenses
      .filter(exp => exp.category === cat)
      .reduce((sum, exp) => sum + exp.amount, 0)
  }));

  // Calculate monthly totals
  const monthlyTotals = expenses.reduce((acc, exp) => {
    const month = moment(exp.date).format('MMMM YYYY');
    acc[month] = (acc[month] || 0) + exp.amount;
    return acc;
  }, {});

  // Calculate daily average
  const today = moment();
  const thisMonth = expenses.filter(exp => 
    moment(exp.date).format('MMMM YYYY') === today.format('MMMM YYYY')
  );
  const dailyAverage = thisMonth.length > 0 
    ? thisMonth.reduce((sum, exp) => sum + exp.amount, 0) / today.date()
    : 0;

  res.render('index', { 
    expenses,
    total,
    categoryTotals,
    monthlyTotals,
    dailyAverage,
    moment,
    formatCurrency
  });
});

app.post('/expenses', (req, res) => {
  const { description, amount, category, date, paymentMode } = req.body;
  expenses.push({
    id: Date.now(),
    description,
    amount: parseFloat(amount),
    category,
    date: date || new Date().toISOString().split('T')[0],
    paymentMode: paymentMode || 'Cash'
  });
  res.redirect('/');
});

app.delete('/expenses/:id', (req, res) => {
  const { id } = req.params;
  expenses = expenses.filter(exp => exp.id !== parseInt(id));
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});