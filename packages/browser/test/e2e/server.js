const path = require('path');

const express = require('express');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(path.resolve(__dirname, './dist')));

app.get('/', function(_req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.listen(port);
console.log('Server started at http://localhost:' + port);
