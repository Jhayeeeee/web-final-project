require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/user");
const Item = require("./models/item");
const multer = require('multer');

// 🟢 BAGO: Naka-setup na ang JWT variables dito
const jwt = require("jsonwebtoken");
const JWT_SECRET = "university_lost_and_found_secret_key";    

// for saving photos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/') // Dito ise-save ang mga litrato
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename para iwas duplicate
    }
});
const upload = multer({ storage: storage });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Failed to connect to MongoDB:", err));

// 🟢 BAGO: Ito ang Middleware na magche-check ng token bago mag-delete o mag-update
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Access Denied. No token provided." });

    const token = authHeader.split(" ")[1];
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // Ise-save dito ang ID at role ng user na nag-request
        next(); // Papayagan nang ituloy ang request
    } catch (error) {
        res.status(400).json({ message: "Invalid token." });
    }
};

app.get("/api/test", (req, res) => {
    res.json({ message: "Test connection successful" });
});

// POST Route para sa Registration
app.post("/api/register", async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered." });
        }

        if (!email.endsWith("@university.edu.ph")) {
            return res.status(400).json({
                message: "Please use your official university email (@university.edu.ph).",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        });

        await newUser.save();
        res.status(201).json({ message: "Registration successful!" });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Server error during registration." });
    }
});

// POST Route for Login
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // 🟢 BAGO: Gagawa na tayo ng Token kapag tama ang password
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: "24h" }
        );

        // 🟢 BAGO: Ipapasa na ang token pabalik sa frontend
        res.status(200).json({
            message: "Login successful!",
            token: token, 
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login." });
    }
});

// POST Route para mag-report ng Lost or Found Item
app.post('/api/items', upload.single('image'), async (req, res) => {
    try {
        const { itemName, description, category, status, location, incidentDate, reportedBy,latitude,longitude} = req.body;
        
        const imageURL = req.file ? '/uploads/' + req.file.filename : null;

        const newItem = new Item({
            itemName,
            description,
            category,
            status,
            location,
            incidentDate,
            reportedBy,
            latitude,
            longitude,
            imageURL
        });

        await newItem.save();
        
        res.status(201).json({ 
            message: "Item successfully reported!", 
            item: newItem 
        });

    } catch (error) {
        console.error("Error reporting item:", error);
        res.status(500).json({ message: "Server error while saving the item." });
    }
});
app.get('/api/items', async (req, res) => {
   try {
        const items = await Item.find().populate({
            path: 'reportedBy',
            select: 'fullName email', // Idinagdag ang fullName dito!
            strictPopulate: false
        });
        res.status(200).json(items);
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ message: "Server error while fetching items." });
    }
});

// 🟢 BAGO: Nilagyan ng 'verifyToken' at restriction logic ang DELETE route
app.delete('/api/items/:id', verifyToken, async (req, res) => {
    try {
        const itemId = req.params.id;
        const item = await Item.findById(itemId);
        
        if (!item) return res.status(404).json({ message: "Item not found." });

        // 🟢 BAGO: Pwede lang i-delete kung admin ang gumagalaw, o kaya siya mismo ang nag-post
        if (req.user.role === 'admin' || item.reportedBy.toString() === req.user.id) {
            await Item.findByIdAndDelete(itemId);
            res.status(200).json({ message: "Item successfully deleted!" });
        } else {
            return res.status(403).json({ message: "Forbidden. You cannot delete this post." });
        }
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ message: "Server error while deleting item." });
    }
});

// 🟢 BAGO: Nilagyan din ng 'verifyToken' ang PUT route para secured ang pag-update ng status
app.put('/api/items/:id/status', verifyToken, async (req, res) => {
    try {
        const itemId = req.params.id;
        const { status } = req.body;
        
        const updatedItem = await Item.findByIdAndUpdate(
            itemId,
            { status: status },
            { new: true }
        );
        
        res.status(200).json({ message: "Status successfully updated!", item: updatedItem });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Server error while updating status." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;