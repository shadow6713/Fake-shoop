require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

const Product = mongoose.model('Product', new mongoose.Schema({ name: String, price: Number, img: String }), 'products');
const User = mongoose.model('User', new mongoose.Schema({ username: String, purchases: [String], requests: { type: Number, default: 0 } }), 'users');
const Counter = mongoose.model('Counter', new mongoose.Schema({ totalRequests: { type: Number, default: 0 } }), 'counters');

async function initData() {
  if (await Product.countDocuments() === 0) {
    await Product.insertMany([
      { name: 'iPhone 15 Pro', price: 999, img: 'https://via.placeholder.com/300x200?text=iPhone+15' },
      { name: 'Samsung Galaxy S24', price: 849, img: 'https://via.placeholder.com/300x200?text=Galaxy+S24' },
      { name: 'MacBook Air M3', price: 1299, img: 'https://via.placeholder.com/300x200?text=MacBook+Air' },
      { name: 'Sony Headphones', price: 399, img: 'https://via.placeholder.com/300x200?text=Headphones' },
      { name: 'Nike Shoes', price: 150, img: 'https://via.placeholder.com/300x200?text=Shoes' },
      { name: 'PS5', price: 499, img: 'https://via.placeholder.com/300x200?text=PS5' },
      { name: 'Apple Watch', price: 399, img: 'https://via.placeholder.com/300x200?text=Watch' },
      { name: 'Dell XPS', price: 1099, img: 'https://via.placeholder.com/300x200?text=XPS' }
    ]);
  }
  if (await Counter.countDocuments() === 0) await Counter.create({});
}
initData();

app.get('/api/products', async (req, res) => res.json(await Product.find()));
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  let user = await User.findOne({ username }) || await User.create({ username, purchases: [], requests: 0 });
  res.json({ role: (username === 'admin' && password === 'admin123') ? 'admin' : 'user', user });
});
app.get('/api/users', async (req, res) => res.json(await User.find()));
app.post('/api/buy', async (req, res) => {
  const { username, prodName } = req.body;
  const counter = await Counter.findOne() || await Counter.create({});
  if (counter.totalRequests >= 200) return res.status(503).json({ crashed: true });
  const user = await User.findOne({ username });
  if (user) {
    user.purchases.push(prodName);
    user.requests++;
    await user.save();
  }
  counter.totalRequests++;
  await counter.save();
  if (counter.totalRequests > 200) {
    console.log('CRASH!');
    setTimeout(() => process.exit(1), 1000);
  }
  res.json({ totalRequests: counter.totalRequests });
});
app.get('/api/counter', async (req, res) => res.json({ totalRequests: (await Counter.findOne()).totalRequests || 0 }));
app.delete('/api/reset', async (req, res) => { await Counter.updateOne({}, { totalRequests: 0 }); res.json({}); });

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Running on ${PORT}`));
