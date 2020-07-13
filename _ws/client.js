const http = require('http');
const session = require('express-session');
const express = require('express');
const WebSocket = require('ws');

const app = express();
const map = new Map();

const sessionParser = session({
    saveUninitialized: false,
    secret: '$eCuRiTy',
    resave: false,
    name: 'stax-session-token'
});

app.use(sessionParser);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', authorize, (req, res) => {
    console.log(req.originalUrl)

    res.send({
        success: true,
        message: 'Access Granted!'
    });
})

app.post('/login', function (req, res) {
    console.log(req.originalUrl)

    const token = require('crypto').createHash('sha256').digest('hex');
    console.log(`Updating session for user ${token}`);

    req.session.token = token;
    res.send({ 
        success: true,
        message: 'Login Successful',
        token
    });
});

app.delete('/logout', authorize, function (req, res) {
    console.log(req.originalUrl)
    
    const ws = map.get(req.session.token);

    console.log('Destroying session', ws);

    req.session.destroy(function () {
        if (ws) ws.close();
        
        res.send({
            success: true,
            message: 'Session destroyed' 
        });
    });
});
function cors (req, res, next) {
    // req.setHeader('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    next();
}
function authorize (req, res, next) {
    console.log('has token?',req.session.token);

    if (req.session.token) {
        next();
    } else {
        res.status(403).send({
            success: false,
            message: 'ACCESS DENIED, BITCH!'
        });
    }
}

//
// Create HTTP server by ourselves.
//
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
    clientTracking: false, 
    // port: 8080
    noServer: true 
});

server.on('upgrade', function (request, socket, head) {
    console.log('on upgrade');

    sessionParser(request, {}, () => {
        if (!request.session.userId) {
            socket.destroy();
            return;
        }

        console.log('Session is parsed!');

        wss.handleUpgrade(request, socket, head, function (ws) {
            wss.emit('connection', ws, request);
        });
    });
});

wss.on('connection', function (ws, request) {
    console.log('on connection');
    const userId = request.session.userId;

    map.set(userId, ws);

    ws.on('message', function (message) {
        console.log('on connection message');
        //
        // Here we can now use session parameters.
        //
        console.log(`Received message ${message} from user ${userId}`);
    });

    ws.on('close', function () {
        console.log('on connection close');
        map.delete(userId);
    });
});

//
// Start the server.
//
server.listen(8000, function () {
    console.log('Listening on http://localhost:8080');
});