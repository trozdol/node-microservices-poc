const url = require('url');
const axios = require('axios');

class ServiceProxy {

    /**
     * Call a service without knowing it's adddress.
     * call({ service: 'auth', method: 'post', params: { limit: 1 }, body: { json: 'data' } })
     */
    async call({ service, version, method, route, params, body, headers }) {
        
        try {
            const { ip, port, name, ver, key } = await this.getService(service, version);
            const url =`http://${ip}:${port}${route || ''}`;
            const config = {
                url: url,
                method,
                params,
                data: body,
                headers
            };
            console.log(`\n>>> Calling Service: ${name} @ ${url} >>>\n`);
            console.log(config);
            return await axios(config);
        } catch (e) {
            throw e;
        }
    }
    
    //TODO: make this call the above method
    async forward(opts) {
        const { route, req, res } = opts;
        try {
            const { ip, port, version, name, key } = await this.getService(opts.name, opts.version);
            const { method, params, query, body } = req;
            const url =`http://${ip}:${port}/${route || ''}`;
            
            console.log(`\n>>> Forwarding to Service: ${name} @ ${url} >>>\n`);
            console.log({body})
            const config = {
                method: method,
                url: url,
                params: query,
                // body: req.body,
                data: req.body,
                headers: {
                    ['cookie']: (req.headers && req.headers.cookie) || ''
                }
            };
            return await axios(config);
        } catch (e) {
            console.error(e.message, __filename);
            throw e;
        }
    }

    async getService(name, version = '1.0.0') {
        console.log(`${__filename}.${'getService'}()`)
        try {
            const url = `http://localhost:3001/registry/${name}/${version || ''}`;
            const response = await axios.get(url);
            if (!response.data.data) {
                throw new Error(`Service, ${name} v${version}, not found.`);
            }
            return response.data.data;
        } catch (e) {
            throw e;
        }
    }
}

module.exports = ServiceProxy;