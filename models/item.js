const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // 'Electronics', 'IDs & Cards', 'Bags', 'Others'
    status: { type: String, enum: ['lost', 'found', 'claimed', 'surrendered'], required: true },
    location: { type: String, required: true },
    incidentDate: { type: String, required: true },
    dateReported: { type: Date, default: Date.now },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageURL: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    reportCount: { type: Number, default: 0 },
    reportedByUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Item', itemSchema);