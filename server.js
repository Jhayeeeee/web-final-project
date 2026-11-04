require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const User = require("./models/user");
const Item = require("./models/item");
const Notification = require("./models/notification");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("JWT_SECRET is missing. Set it in your environment variables.");
    process.exit(1);
}

// --- CLOUDINARY CONFIG ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// --- FILE UPLOAD (nasa memory muna, diretso sa Cloudinary) ---
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files are allowed."));
    }
});

const uploadSingle = (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message });
        next();
    });
};

function uploadToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "lost-and-found", resource_type: "image" },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
    });
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB, database:", mongoose.connection.name))
    .catch((err) => console.error("Failed to connect to MongoDB:", err));

// --- MIDDLEWARE: check ng token ---
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Access Denied. No token provided." });

    const token = authHeader.split(" ")[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token. Please login again." });
    }
};

app.get("/api/test", (req, res) => {
    res.json({ message: "Test connection successful" });
});

// --- REGISTER ---
app.post("/api/register", async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!email || !email.endsWith("@university.edu.ph")) {
            return res.status(400).json({
                message: "Please use your official university email (@university.edu.ph)."
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await new User({ fullName, email, password: hashedPassword }).save();
        res.status(201).json({ message: "Registration successful!" });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Server error during registration." });
    }
});

// --- LOGIN ---
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        if (user.isBanned) {
            return res.status(403).json({ message: "Your account has been restricted by the Admin." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login." });
    }
});


// --- UPDATE ITEM STATUS (admin o ang owner, may limitasyon) ---
app.put("/api/items/:id/status", verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const isAdmin = req.user.role === "admin";

        const previousItem = await Item.findById(req.params.id);
        if (!previousItem) return res.status(404).json({ message: "Item not found." });

        if (isAdmin) {
            // Admin: 'claimed' lang kapag surrendered na ang item sa admin office
            if (status === "claimed" && previousItem.status !== "surrendered") {
                return res.status(400).json({
                    message: "Only items surrendered to the admin office can be marked as claimed."
                });
            }
        } else {
            // Owner lang ang puwedeng mag-update ng sariling post
            const isOwner = previousItem.reportedBy && previousItem.reportedBy.toString() === req.user.id;
            if (!isOwner) {
                return res.status(403).json({ message: "Forbidden. You can only update your own posts." });
            }

            // Owner: 'claimed' (nahanap o naibalik na) o 'surrendered' (ibinigay sa admin, found items lang)
            const isAllowed =
                status === "claimed" ||
                (status === "surrendered" && previousItem.status === "found");

            if (!isAllowed) {
                return res.status(403).json({ message: "Forbidden. You cannot set this status." });
            }
        }

        const wasSurrendered = previousItem.status === "surrendered";

        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        // Notification sa student kapag na-claim ng admin ang surrendered na item niya
        if (isAdmin && wasSurrendered && status === "claimed" && updatedItem.reportedBy) {
            await Notification.create({
                recipient: updatedItem.reportedBy,
                type: "item_claimed",
                title: "Your surrendered item was claimed",
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

// --- ADMIN: GET ALL NON-ADMIN USERS (kasama ang walang role field) ---
app.get("/api/users", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const users = await User.find({ role: { $ne: "admin" } }).select("-password");
        res.status(200).json(users);
    } catch (error) {
        console.error("Fetch Users Error:", error);
        res.status(500).json({ message: "Server error while fetching users." });
    }
});

// --- REPORT ITEM (may login at image upload sa Cloudinary) ---
app.post("/api/items", verifyToken, uploadSingle, async (req, res) => {
    try {
        const { itemName, description, category, status, location, incidentDate, latitude, longitude } = req.body;

        // Pigilan ang double post: kung may parehong pangalan galing sa parehong user sa nakaraang 60 segundo
        const recentDuplicate = await Item.findOne({
            reportedBy: req.user.id,
            itemName,
            dateReported: { $gte: new Date(Date.now() - 60 * 1000) }
        });
        if (recentDuplicate) {
            return res.status(409).json({
                message: "This item was just posted. Please wait a moment before posting it again."
            });
        }

        const newItem = new Item({
            itemName,
            description,
            category,
            status,
            location,
            incidentDate,
            reportedBy: req.user.id, // galing sa token, hindi sa form
            latitude: latitude || null,
            longitude: longitude || null
        });

        // I-validate muna bago mag-upload, para walang naiwang larawan sa Cloudinary kung mali ang data
        await newItem.validate();

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            newItem.imageURL = result.secure_url;
        }

        await newItem.save();

        res.status(201).json({
            message: "Item successfully reported!",
            item: newItem
        });
    } catch (error) {
        console.error("Error reporting item:", error);
        res.status(500).json({
            message: "Server error while saving the item.",
            detail: error.message
        });
    }
});

// --- GET ALL ITEMS ---
app.get("/api/items", async (req, res) => {
    try {
        const items = await Item.find().populate({
            path: "reportedBy",
            select: "fullName email isBanned",
            strictPopulate: false
        });
        res.status(200).json(items);
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ message: "Server error while fetching items." });
    }
});

// --- DELETE ITEM (admin o ang nag-post) ---
app.delete("/api/items/:id", verifyToken, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Item not found." });

        const isPoster = item.reportedBy && item.reportedBy.toString() === req.user.id;
        if (req.user.role === "admin" || isPoster) {
            await Item.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: "Item successfully deleted!" });
        } else {
            res.status(403).json({ message: "Forbidden. You cannot delete this post." });
        }
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ message: "Server error while deleting item." });
    }
});

// --- UPDATE ITEM STATUS (admin only) + notification kapag na-claim ang surrendered ---
app.put("/api/items/:id/status", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden. Admins only." });
        }

        const { status } = req.body;

        const previousItem = await Item.findById(req.params.id);
        if (!previousItem) return res.status(404).json({ message: "Item not found." });

        const wasSurrendered = previousItem.status === "surrendered";

        // runValidators: sinisigurong valid ang status ayon sa enum sa model
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (wasSurrendered && status === "claimed" && updatedItem.reportedBy) {
            await Notification.create({
                recipient: updatedItem.reportedBy,
                type: "item_claimed",
                title: "Your surrendered item was claimed",
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

// --- REPORT A POST (spam) ---
app.post("/api/items/:id/report", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id; // galing sa token

        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (!Array.isArray(item.reportedByUsers)) item.reportedByUsers = [];
        if (typeof item.reportCount !== "number" || isNaN(item.reportCount)) item.reportCount = 0;

        const alreadyReported = item.reportedByUsers.some(
            (id) => id.toString() === userId.toString()
        );
        if (alreadyReported) {
            return res.status(400).json({ message: "You have already reported this item." });
        }

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

// --- DISMISS REPORTS (admin only) ---
app.put("/api/items/:id/dismiss-report", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
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

// --- CHANGE PASSWORD ---
app.put("/api/users/change-password", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect current password." });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ message: "Server error while updating password." });
    }
});

// --- NOTIFICATIONS: GET ---
app.get("/api/notifications", verifyToken, async (req, res) => {
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
app.put("/api/notifications/read-all", verifyToken, async (req, res) => {
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
app.put("/api/notifications/:id/read", verifyToken, async (req, res) => {
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

// --- NOTIFICATIONS: clear one (ang sariling notification lang) ---
app.delete("/api/notifications/:id", verifyToken, async (req, res) => {
    try {
        const deleted = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user.id
        });
        if (!deleted) return res.status(404).json({ message: "Notification not found." });

        res.status(200).json({ message: "Notification deleted." });
    } catch (error) {
        console.error("Delete Notification Error:", error);
        res.status(500).json({ message: "Server error while deleting notification." });
    }
});

// --- NOTIFICATIONS: clear all (ang sa user lang na naka-login) ---
app.delete("/api/notifications", verifyToken, async (req, res) => {
    try {
        const result = await Notification.deleteMany({ recipient: req.user.id });
        res.status(200).json({
            message: "All notifications cleared.",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Clear Notifications Error:", error);
        res.status(500).json({ message: "Server error while clearing notifications." });
    }
});


// --- ADMIN: BROADCAST NOTIFICATION SA LAHAT NG STUDENTS ---
app.post("/api/admin/notifications/broadcast", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden. Admins only." });
        }

        const title = (req.body.title || "").trim();
        const message = (req.body.message || "").trim();

        if (!title || !message) {
            return res.status(400).json({ message: "Title and message are required." });
        }
        if (title.length > 100 || message.length > 500) {
            return res.status(400).json({ message: "Title must be 100 characters or less, and message 500 or less." });
        }

        // Lahat ng hindi admin, kasama ang users na walang role field
        const users = await User.find({ role: { $ne: "admin" } }).select("_id");
        if (users.length === 0) {
            return res.status(404).json({ message: "No student accounts found to notify." });
        }

        const docs = users.map((u) => ({
            recipient: u._id,
            type: "admin_broadcast",
            title,
            message
        }));
        await Notification.insertMany(docs);

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