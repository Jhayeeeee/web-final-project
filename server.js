    require("dotenv").config();
    const express = require("express");
    const path = require("path");
    const cors = require("cors");
    const mongoose = require("mongoose");
    const bcrypt = require("bcrypt");
    const User = require("./models/user");
    const Item = require("./models/item");
    const multer = require('multer');
    

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

    app.get("/api/test", (req, res) => {
    res.json({ message: "Test connection successful" });
    });




    // POST Route para sa Registration
    app.post("/api/register", async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // 1. validation to avoid duplicate email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
        return res.status(400).json({ message: "Email is already registered." });
        }

        // 2. Checking kung ang email domain
        if (!email.endsWith("@university.edu.ph")) {
        return res
            .status(400)
            .json({
            message: "Please use your official university email (@plm.edu.ph).",
            });
        }

        // 3. Hashing the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Saving the new account to the database
        const newUser = new User({
        fullName,
        email,
        password: hashedPassword, // Encrypted password
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

        // 1. Hanapin ang user sa database gamit ang email
        const user = await User.findOne({ email });
        if (!user) {
        return res.status(400).json({ message: "Invalid email or password." });
        }

        // 2. I-check kung tama ang password gamit ang bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password." });
        }

        // 3. Kapag tama ang email at password, ipapasa natin ang data sa frontend
        res.status(200).json({
        message: "Login successful!",
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
        // 1. DAPAT NANDITO ANG incidentDate (Line 101)
        const { itemName, description, category, status, location, incidentDate, reportedBy,latitude,longitude} = req.body;
        
        const imageURL = req.file ? '/uploads/' + req.file.filename : null;

        const newItem = new Item({
            itemName,
            description,
            category,
            status,
            location,
            incidentDate, // 2. AT DAPAT NANDITO RIN (Line 111)
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
        // Safe populate para hindi mag-crash ang server kung may sirang test data
        const items = await Item.find().populate({
            path: 'reportedBy',
            select: 'email',
            strictPopulate: false
        });
        res.status(200).json(items);
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ message: "Server error while fetching items." });
    }
});

// DELETE Route para burahin ang item
app.delete('/api/items/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        await Item.findByIdAndDelete(itemId);
        res.status(200).json({ message: "Item successfully deleted!" });
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ message: "Server error while deleting item." });
    }
});

// PUT Route para i-update ang status ng item (papuntang 'surrendered' o 'claimed')
app.put('/api/items/:id/status', async (req, res) => {
    try {
        const itemId = req.params.id;
        const { status } = req.body; // Kukunin ang bagong status mula sa frontend
        
        const updatedItem = await Item.findByIdAndUpdate(
            itemId,
            { status: status },
            { new: true } // Ibig sabihin ibabalik niya yung updated na data
        );
        
        res.status(200).json({ message: "Status successfully updated!", item: updatedItem });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Server error while updating status." });
    }
});

    // 4. Server Listen (DAPAT NASA PINAKADULO ITO)
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    });

    module.exports = app;
