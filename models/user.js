const mongoose = require('mongoose');

// blueprint 
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true // Pinipigilan nito ang pag-register ng parehong email nang dalawang beses
    },
    password: {
        type: String,
        required: true
    },

    
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student' // 'student' ang default para lahat ng bagong register ay student agad
    }
}, { timestamps: true });  


module.exports = mongoose.model('User', userSchema);