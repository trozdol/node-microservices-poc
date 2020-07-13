const express = require('express');
const service = express();
const { 
    init, 
    json, 
    session, 
    cookies, 
    setup, 
    token,
    authorize, 
    response, 
    error
} = require('../src/lib/middleware');

service.use(init, json, session, cookies, token, setup);

service.all('/', authorize, (req, res, next) => {
    console.log(__filename)

    res.body('data', {
        message: 'admin'
    });
    next();
});

service.use(response, error)

module.exports = service;