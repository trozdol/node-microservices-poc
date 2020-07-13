const Server = require('../src/lib/server');

console.log(__dirname);

const name = 'registry';
const version = '1.0.0';
const port = 3001;

const service = require(`./service.${name}`);

service.set('name',    name);
service.set('version', version);
service.set('port',    port);

const server = new Server(service)

server.start();

module.exports = {
    name, 
    version, 
    port,
    service,
    server
};