const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        type: { type: String, enum: ["item_claimed", "admin_broadcast"], required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", default: null },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);