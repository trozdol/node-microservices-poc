
const express = require('express');
// const session = require('express-session');
const service = express();

const { 
    init,
    cors,
    json, 
    session, 
    cookies, 
    token,
    authorize,
    setup,
    response, 
    error 
} = require('../src/lib/middleware');

service.use(init)
service.use(cors)
service.use(json)
service.use(cookies)
service.use(session)
service.use(token)
service.use(setup)

service.post('/verify', function (req, res, next) {
    console.log(req.originalUrl, req.params, req.body)
    
    const token = req.body.token;
    console.log('VEFIFYING TOKEN: ', token)
    // console.log(session.store.get(token));
    if (token === req.session.token) {
        res.body('success', true);
        res.body('message', 'Token Valid');
    } else {
        res.body('success', false);
        res.body('message', 'Token Invalid');
    }

    next();
});

service.get('/', authorize, (req, res) => {
    console.log(req.originalUrl)

    res.send({
        success: true,
        message: 'Access Granted!'
    });
})

service.post('/login', function (req, res, next) {
    console.log('/login', req.body)

    const token = require('crypto').createHash('sha256').digest('hex');
    
    if (req.body.email && req.body.password) {
        console.log(`Updating session for user ${token}`);
        req.token = token;
        req.session.token = token;
        req.session.email = req.body.email;
        req.session.save(() => {
            console.log('session saved')
            res.body('success', true)
            res.body('message', 'Login Successful')
            res.body('token',   token);
            next();
        });
    } else {
        res.body('success', false)
        res.body('message', 'Login failed')
        res.body('token',   '');
        console.log(res.body())
        next();
    }
});

service.all('/logout', authorize, function (req, res, next) {
    console.log(req.originalUrl)
    
    const ws = req.session.store.get(req.session.token);

    console.log('Destroying session', ws);

    req.session.destroy(() => {
        if (ws) ws.close();

        res.body('success', true),
        res.body('message', 'Session destroyed');
        next();
    });
});

service.use(response)
service.use(error)

module.exports = service;

