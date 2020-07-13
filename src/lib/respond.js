function respond(handler) {

    return (req, res, next) => {
        let cachedUsername;
    
        try {
            cachedUsername = (req.user && req.user.username) ? req.user.username : (req.body ? req.body.username || '' : '');
            cachedUsername = cachedUsername || '';
        } catch(e) {
            cachedUsername = '';
        }
        // Store the response Promise
        let response;
        
        try {
            // Attempt to handle the request with the given handler
            response = Promise.resolve(handler(req, res));
        } catch (err) {
            // If there is an uncaught exception (not a promise rejection), safely wrap it in a promise rejection
            response = Promise.reject(new Error(500, 'Unknown Error', err));
        }

        // Process the Promise-wrapped response
        return response.then(result => {
                redact(req);
                
                console.log({ 
                    message: "Request Handled Successfully", 
                    status: 200, 
                    additionalData: { 
                        route: req.originalUrl.split('?')[0], 
                        data: { 
                            query  : Object.keys(req.query).length  ? req.query  : "No Query Data", 
                            params : Object.keys(req.params).length ? req.params : "No URL Param Data", 
                            body   : Object.keys(req.body).length   ? req.body   : "No Body Data" 
                        },
                        user: !req.user || !Object.keys(req.user).length ? "Unidentified User" : req.user 
                    } 
                });

                if (result && result.responseIsRedirect) {
                    res.redirect(result.redirectTo);
                } else {
                    res.status(200).json(result);
                }

            }).catch(error => {
                redact(req);

                if (error.status === 500) {
                    
                    console.error({ 
                        message: error.message,     
                        status: error.status, 
                        additionalData: { 
                            rawError: errorToString(error), 
                            route: req.originalUrl.split('?')[0], 
                            data: { 
                                query: Object.keys(req.query).length ? req.query : "No Query Data", 
                                params: Object.keys(req.params).length ? req.params : "No URL Param Data", 
                                body: Object.keys(req.body).length ? req.body : "No Body Data" 
                            }, 
                            user: !req.user || !Object.keys(req.user).length ? "Unidentified User" : req.user 
                        } 
                    });

                } else {
                    
                    console.warn({ 
                        message: error.message, 
                        status: error.status, 
                        additionalData: { 
                            rawError: errorToString(error), 
                            route: req.originalUrl.split('?')[0], 
                            data: { 
                                query: Object.keys(req.query).length ? req.query : "No Query Data", 
                                params: Object.keys(req.params).length ? req.params : "No URL Param Data", 
                                body: Object.keys(req.body).length ? req.body : "No Body Data" 
                            }, 
                            user: !req.user || !Object.keys(req.user).length ? "Unidentified User" : req.user 
                        } 
                    });
                }

                res.status(error.status || error.statusCode || 500).json({ 
                    message: (error.status && error.status !== 500) ? error.message : 'Unknown Error', 
                    data: error.additionalData ? error.additionalData.send : undefined 
                });

            }).catch(error => {

                console.error({ 
                    message: error.message || "Unknown Error", 
                    status: error.status || error.statusCode || 500, 
                    additionalData: { 
                        rawError: errorToString(error), 
                        route: req.originalUrl.split('?')[0], 
                        data: { 
                            query: Object.keys(req.query).length ? req.query : "No Query Data", 
                            params: Object.keys(req.params).length ? req.params : "No URL Param Data", 
                            body: Object.keys(req.body).length ? req.body : "No Body Data" 
                        }, 
                        user: !req.user || !Object.keys(req.user).length ? "Unidentified User" : req.user 
                    } 
                });

                res.status(500).json({ message: 'Unknown Error' });

            }).finally(() => {
                // tracking.trackRequest(req, res, cachedUsername)
            });
    };
}

function redact(req) {
    for (let field of protectedFields) {
        if (req.body[field]) { req.body[field] = "**PROTECTED FIELD**"; }
        if (req.query[field]) { req.query[field] = "**PROTECTED FIELD**"; }
        if (req.params[field]) { req.params[field] = "**PROTECTED FIELD**"; }
    }
}

function errorToString(error) {
    if (error instanceof Error) {
        return JSON.stringify({ stack: error.stack || error.toString(), additionalData: error.additionalData });
    } else {
        return JSON.stringify(error);
    }
}