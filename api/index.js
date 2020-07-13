const name = 'api';
const version = '1.0.0';
const port = 3000;

const service = require(`./service.${name}.js`);

service.set('name',    name);
service.set('version', version);
service.set('port',    port);

const server = new (require('../src/lib/server'))(service).start();

module.exports = {
    name,
    version, 
    port,
    service,
    server
};

