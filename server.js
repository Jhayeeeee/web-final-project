const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/test', (req, res) => {
    res.json({message: "Test connection successful"});
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`)
});

