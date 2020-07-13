const express = require('express');
const service = express();
const registry = new (require('./registry'))();
const { init, json, session, cookies, setup, authorize, response, error } = require('../src/lib/middleware');

service.use(init, json, cookies, session, setup)

service.get('/registry', (req, res, next) => {
    const { name, version } = req.params;
    const services = registry.get(name, version);
    res.body('data', services);
    next();
})

service.get('/registry/:name/:version', (req, res, next) => {
    const { name, version } = req.params;
    const service = registry.get(name, version);
    if (!service) return res.status(404).json({ result: 'Service not found' });
    res.body('data', service);
    next();
})

service.put('/registry/:name/:version/:port', (req, res, next) => {
    const { name, version, port } = req.params;
    const ip = getClientIPv4(req);
    const service = registry.register(name, version, ip, port);
    res.body('data', service);
    next();
})

service.delete('/registry/:name/:version/:port', (req, res, next) => {
    const { name, version, port } = req.params;
    const service = registry.unregister(name, version, ip, port);
    const success = service ? true : false;

    res.body('success', success);
    res.body('message', 'Unregistered Service Success');
    res.body('data', service);
    next();
})

service.use(response)
service.use(error)

module.exports = service;

function getClientIPv4(req) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7)
    }
    return ip;
}