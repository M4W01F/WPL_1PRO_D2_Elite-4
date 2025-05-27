const express = require('express');
const path = require('path');
const app = express();
// Route naar index.html verander naar ejs na verandering
/*
app.get('/', (req, res) => {
    res.render('index'); Renders index.ejs na aanmaak
});
*/
// Serve static files
app.use(express.static(__dirname));

// Routes for different pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

// Start server
app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});
