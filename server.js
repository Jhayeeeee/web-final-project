require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/user");
const Item = require("./models/item");
const Notification = require("./models/notification");
const multer = require('multer');

// 🟢 BAGO: Naka-setup na ang JWT variables dito
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

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

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // --- 🔴 BAGONG DAGDAG: BAN CHECK ---
        // Iche-check natin ito BAGO pa i-verify ang password
        if (user.isBanned) {
            return res.status(403).json({ message: "Your account has been restricted by the Admin." });
        }
        // -----------------------------------

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // 🟢 Gagawa ng Token kapag tama ang password at HINDI banned
        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        // 🟢 Ipapasa ang token pabalik sa frontend
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

// --- ADMIN: BAN / UNBAN USER API ---
app.put('/api/users/:id/ban', verifyToken, async (req, res) => {
    try {
        // 1. Siguraduhin na Admin ang nagre-request (Security)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        // 2. Hanapin ang user na iba-ban/i-u-unban sa database
        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 3. I-toggle ang isBanned status (kung false -> true, kung true -> false)
        userToUpdate.isBanned = !userToUpdate.isBanned;
        await userToUpdate.save();

        res.status(200).json({
            message: `User successfully ${userToUpdate.isBanned ? 'banned' : 'unbanned'}.`,
            isBanned: userToUpdate.isBanned
        });
    } catch (error) {
        console.error("Ban User Error:", error);
        res.status(500).json({ message: 'Server error while updating user status.' });
    }
});

// --- ADMIN: GET ALL USERS API ---
app.get('/api/users', verifyToken, async (req, res) => {
    try {
        // Siguraduhing admin lang ang pwedeng makakita ng listahan
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        // Kunin lahat ng users na hindi admin, at itago ang kanilang passwords para safe
        const users = await User.find({ role: 'user' }).select('-password');
        res.status(200).json(users);
    } catch (error) {
        console.error("Fetch Users Error:", error);
        res.status(500).json({ message: 'Server error while fetching users.' });
    }
});

// POST Route para mag-report ng Lost or Found Item
app.post('/api/items', upload.single('image'), async (req, res) => {
    try {
        const { itemName, description, category, status, location, incidentDate, reportedBy, latitude, longitude } = req.body;

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
            select: 'fullName email isBanned', // Idinagdag ang fullName dito!
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

// PUT route para i-update ang status ng item (admin only)
app.put('/api/items/:id/status', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden. Admins only." });
        }

        const { status } = req.body;

        const previousItem = await Item.findById(req.params.id);
        if (!previousItem) return res.status(404).json({ message: "Item not found." });

        const wasSurrendered = previousItem.status === 'surrendered';

        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );

        // Notify the student who surrendered the item once it is claimed
        if (wasSurrendered && status === 'claimed' && updatedItem.reportedBy) {
            await Notification.create({
                recipient: updatedItem.reportedBy,
                type: 'item_claimed',
                title: 'Your surrendered item was claimed',
                message: `"${updatedItem.itemName}" has been claimed by its owner. Thank you for returning it!`,
                item: updatedItem._id
            });
        }

        res.status(200).json({ message: "Status successfully updated!", item: updatedItem });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Server error while updating status." });
    }
});

// POST route para mag-report ng item
app.post('/api/items/:id/report', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // 🟢 FIX: Siguraduhing may default array at number para sa mga lumang database items
        if (!Array.isArray(item.reportedByUsers)) {
            item.reportedByUsers = [];
        }
        if (typeof item.reportCount !== 'number' || isNaN(item.reportCount)) {
            item.reportCount = 0;
        }

        // 🟢 FIX: Ligtas na pag-check kung na-report na ng user (string comparison)
        const alreadyReported = item.reportedByUsers.some(
            (id) => id.toString() === userId.toString()
        );

        if (alreadyReported) {
            return res.status(400).json({ message: "You have already reported this item." });
        }

        // Add user ID at dagdag +1 sa report count
        item.reportedByUsers.push(userId);
        item.reportCount += 1;

        await item.save();

        res.status(200).json({
            message: "Item reported successfully",
            reportCount: item.reportCount
        });

    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({ message: "Server error while reporting item." });
    }
});

// PUT route para i-dismiss ang reports ng isang item (admin only)
app.put('/api/items/:id/dismiss-report', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden. Admins only." });
        }

        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            { $set: { reportCount: 0, reportedByUsers: [] } },
            { new: true }
        );

        if (!updatedItem) return res.status(404).json({ message: "Item not found." });

        res.status(200).json({ message: "Reports dismissed successfully.", item: updatedItem });
    } catch (error) {
        console.error("Dismiss Report Error:", error);
        res.status(500).json({ message: "Server error while dismissing report." });
    }
});

// --- CHANGE PASSWORD API ROUTE ---
app.put('/api/users/change-password', verifyToken, async (req, res) => {
    try {
        // Ang req.user ay manggagaling sa iyong verifyToken middleware
        const userId = req.user.id || req.user._id;
        const { currentPassword, newPassword } = req.body;

        // 1. Hanapin ang user sa database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 2. I-verify kung tama ang Current Password gamit ang bcrypt
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password.' });
        }

        // 3. I-encrypt (hash) ang New Password bago i-save
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. I-update ang database
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully!' });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ message: 'Server error while updating password.' });
    }
});

// --- NOTIFICATIONS: GET notifications ng naka-login na user ---
app.get('/api/notifications', verifyToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });

        res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        console.error("Fetch Notifications Error:", error);
        res.status(500).json({ message: "Server error while fetching notifications." });
    }
});

// --- NOTIFICATIONS: mark all as read ---
app.put('/api/notifications/read-all', verifyToken, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ message: "All notifications marked as read." });
    } catch (error) {
        console.error("Read All Notifications Error:", error);
        res.status(500).json({ message: "Server error while updating notifications." });
    }
});

// --- NOTIFICATIONS: mark one as read ---
app.put('/api/notifications/:id/read', verifyToken, async (req, res) => {
    try {
        const updated = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { isRead: true },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Notification not found." });

        res.status(200).json({ message: "Notification marked as read." });
    } catch (error) {
        console.error("Read Notification Error:", error);
        res.status(500).json({ message: "Server error while updating notification." });
    }
});

// --- ADMIN: BROADCAST NOTIFICATION SA LAHAT NG USERS ---
app.post('/api/admin/notifications/broadcast', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden. Admins only." });
        }

        const title = (req.body.title || '').trim();
        const message = (req.body.message || '').trim();

        if (!title || !message) {
            return res.status(400).json({ message: "Title and message are required." });
        }
        if (title.length > 100 || message.length > 500) {
            return res.status(400).json({ message: "Title must be 100 characters or less, and message 500 or less." });
        }

      // Lahat ng hindi admin ay makakatanggap (kasama ang users na walang role field)
        const users = await User.find({ role: { $ne: 'admin' } }).select('_id');

        if (users.length === 0) {
        return res.status(404).json({ message: "No student accounts found to notify." });
            }

        const docs = users.map(u => ({
            recipient: u._id,
            type: 'admin_broadcast',
            title,
            message
        }));

        if (docs.length > 0) {
            await Notification.insertMany(docs);
        }

        res.status(201).json({
            message: `Notification sent to ${docs.length} user(s).`,
            sentCount: docs.length
        });
    } catch (error) {
        console.error("Broadcast Error:", error);
        res.status(500).json({ message: "Server error while sending notification." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;