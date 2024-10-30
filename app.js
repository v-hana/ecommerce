const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const authRoutes = require('./routes/authRoute');
const cartRoutes = require('./routes/cartRoute');
const isAuthenticated = require('./middleware/auth'); 
const adminRoutes = require('./routes/adminRoutes');
const clientRoutes = require('./routes/clientRoutes')
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const app = express();
const bcrypt = require('bcrypt');


// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session configuration

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        mongoUrl: 'mongodb://localhost:27017/yourDB', 
        
    }),
    cookie: { maxAge: 180 * 60 * 1000 } // 3 hours
}))
// Database connection
mongoose.connect('mongodb://localhost:27017/yourDB', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));
  
app.use('/',clientRoutes)
app.get('/products', clientRoutes)
app.use('/auth', authRoutes);
app.use('/cart', cartRoutes);


app.use("/admin", adminRoutes)
app.get("/overview", adminRoutes);
app.get("/login", adminRoutes)
app.get("/add-product", adminRoutes)
app.get("/product-list", adminRoutes)
app.get("/edit-product", adminRoutes)
app.get("/stock", adminRoutes)
app.get("/logout", adminRoutes)

const password = '123';
bcrypt.hash(password, 10).then((hash) => console.log(hash));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
