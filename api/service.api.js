const semver = require('semver');
const service = require('express')();
const ServiceProxy = require('../src/lib/service-proxy');
const serviceProxy = new ServiceProxy();

const { init, json, session, cookies, setup, token, authorize, response, error } = require('../src/lib/middleware');

service.use(
    init, 
    cookies, 
    session, 
    json, 
    setup, 
    token
);

/**
 * http://localhost:3000/api/v1/auth/login
 */
service.all('/api/:version/:name/*', api);
service.all('/api/:version/:name', api);
service.use(response);
service.use(error);

module.exports = service;

async function api(req, res, next) {
    

    const version = semver.coerce(req.params.version || 'v1').version;
    const name = req.params.name;
    const route = req.params[0];

    serviceProxy
        .forward({ name, version, route, req, res })
        .then(response => {
            console.log(`${__filename}.${'then'}()`)

            res.body('api', {
                success: true,
                message: response.message
            });
            return response;
        })
        .catch(error => {
            console.log(`${__filename}.${'catch'}()`)
            console.log(error.message)
            res.body('api', {
                success: true,
                message: error.message
            });
            return error.response;
        })
        .then(response => {
            console.log(`${__filename}.${'then2'}()`)
            // console.log('post catch then', response);
            // apply headers from proxied response
            if (response) {
                Object.keys(response.headers || {}).forEach(headerName => {
                    res.setHeader(headerName, response.headers[headerName]);
                });
                res.body('message', response.statusText);
                res.body('data',    response.data);
            } else {
                next(new Error('Service not found.'));
            }
        })
        .finally(next);
}