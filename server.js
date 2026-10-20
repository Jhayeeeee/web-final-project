require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

    mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB:', err));

    app.get('/api/test', (req, res) => {
    res.json({message: "Test connection successful"});
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`)
});

// POST Route para sa Registration
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // 1. validation to avoid duplicate email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered." });
        }

        // 2. Checking kung ang email domain
        if (!email.endsWith('@university.edu.ph')) {
            return res.status(400).json({ message: "Please use your official university email (@plm.edu.ph)." });
        }

        // 3. I-e-encrypt ang password (Hashing)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Ise-save ang bagong account sa database
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword // Yung encrypted na ang ise-save natin
        });

        await newUser.save();
        res.status(201).json({ message: "Registration successful!" });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Server error during registration." });
    }
});
module.exports = app;