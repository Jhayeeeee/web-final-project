const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // Halimbawa: 'Electronics', 'IDs & Cards', 'Bags'
    status: { type: String, enum: ['lost', 'found', 'claimed', 'surrendered'], required: true },
    location: { type: String, required: true },
    dateReported: { type: Date, default: Date.now },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Naka-link sa ID ng nag-report
    imageURL: { type: String }, // Placeholder para sa link ng picture
    location: { type: String, required: true },
    incidentDate: { type: String, required: true }, 
    latitude:{type: Number},
    longitude:{type: Number},
    reportCount:{type: Number, default: 0},
    reportedByUsers:[{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
});

module.exports = mongoose.model('Item', itemSchema);