const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname, { index: false }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'LandingPagina.html'));
});

app.get('/index.html', (req, res) => {
    res.status(403).send('Access Denied');
});

// Start server
app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});