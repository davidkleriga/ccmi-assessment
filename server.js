
const path = require('path');
const express = require('express');
const server = express();
const port = process.env.PORT || 3000;

const publicPath = path.join(__dirname, 'public');

server.use(express.static(publicPath));
server.listen(port, () => console.log(`server listening on ${port}`));
