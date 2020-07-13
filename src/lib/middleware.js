const os = require('os');
const config = require('../../config');
const express = require('express');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const ServiceProxy = require('./service-proxy');
const { read } = require('fs');
const sessionStore = (session, config) => new (require('connect-mongo')(session))(config);


function init (req, res, next) {
    console.log('------------------------------------------------');
    console.log(`${__filename}.${arguments.callee.name}()`)
    next()
}

function cors (req, res, next) {
    console.log(`${__filename}.${arguments.callee.name}()`)
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
}

function json (req, res, next) {
    console.log(`${__filename}.${arguments.callee.name}()`)
    return express.json()(req, res, next);
}

function cookies (req, res, next) {
    console.log(`${__filename}.${arguments.callee.name}()`)
    return cookieParser()(req, res, next);
}

function session (req, res, next) {
    console.log(`${__filename}.${arguments.callee.name}()`)
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    config.session.store = sessionStore(expressSession, config.sessionStore);
    return expressSession(config.session)(req, res, next);

    // return expressSession({
    //     saveUninitialized: false,
    //     secret: '$eCuRiTy',
    //     resave: false,
    //     name: 'stax-session-token',
    //     expires
    // })(req, res, next);
}

function setup (req, res, next) {
    console.log(`${__filename}.${arguments.callee.name}()`)
    req.params = req.params || {};
    req.query  = req.query || {};
    req.body   = req.body || {};

    const { protocol, method, baseUrl, originalUrl, session, cookies, query, params, body, } = req;
    
    console.log(method + ' ' + originalUrl);
    console.log({ protocol, method, baseUrl, originalUrl, session, cookies, query, query, params, body });

    res.body = function (key, val) {
        
        this._body = this._body || {};

        if (!key && !val) {
            return this._body;
        }

        if (key == 'data') {
            if (Array.isArray(val)) {
                this._body.total = val.length;
                if (val.length === 1) val = val[0];
            } else {
                this._body.data = val;
            }
        } else {
            this._body[key] = val;
        }
    };

    res._body = {
        success: true,
        message: 'success',
        total: undefined,
        data: undefined
    };

    next();
}

function token (req, res, next) {
    console.log(`${__filename}.${arguments.callee.name}()`)
    
    var cookies = req.cookies = req.cookies || {};
    var session = req.session = req.session || {};
    var query   = req.query   = req.query   || {};
    var body    = req.body    = req.body    || {};

    // console.log('cookies  :', cookies);
    // console.log('session  :', session);
    // console.log('query    :',   query);
    // console.log('body     :',    body);

    var token = (cookies && cookies.token)
             || (session && session.token)
             || (query   && query.token)
             || (body    && body.token)
             || (null);

    req.token = token;
    console.log('token:', req.token);

    next();
}

function authorize (req, res, next) {
    console.log(`${__filename}.${arguments.callee.name}()`)

    if (req.token) {
        console.log('token found... is token valid?');
        
        new ServiceProxy().call({
                service: 'auth',
                route: '/verify',
                method: 'post',
                params: {},
                body: {
                    token: req.session.token
                },
                headers: req.headers
            })
            .then(resp => {
                console.log(resp)
                res.body('message', '?');
                next();
            })
            .catch(next);
    } else {

        res.body('message', 'no go?');
        next();
    }
}

function response (req, res, next) {
    console.log(`${__filename}.${arguments.callee.name}()`)
    const { protocol, method, baseUrl, originalUrl, session, cookies, query, params, body, } = req;

    res.body('debug', {
        // hostname: os.hostname(),
        // protocol, 
        // method, 
        // baseUrl,
        // originalUrl,
        cookies, 
        session, 
        // query,
        // params,
        // body
    });
    
    res.status(200).json(res.body());
}

function error (err, req, res, next) {
    console.log(`${__filename}.${arguments.callee.name}()`)
    console.error(err);

    const status = (err.status || 500);
    
    res.status(status).json({
        status, 
        error: err.message, 
        route: req.originalUrl
    });
}

module.exports = {
    init,
    cors,
    json,
    cookies, 
    session,
    setup, 
    token,
    authorize, 
    response, 
    error 
};