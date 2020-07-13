const http = require('http');
const axios = require('axios');

class Server {

    service;
    name;
    version;
    port;

    server;

    family;
    host;
    port
    ip;

    constructor(service) {
        
        this.service = service;
        this.name = service.get('name');
        this.version = service.get('version');
        this.port = service.get('port') || 0;

        this.server  = http.createServer(service);

        this.server.on('error', this.error, this);
        this.server.on('listening', () => {
            this.ready()
        });
        console.log(`Server created for ${this.name} v${this.version} on ${this.port}`)
    }

    on(event, callback) {
        this.server.on(event, callback, this);
    }

    start() {
        this.server.listen(this.port);
        return this;
    }
    
    stop() {
        this.server.stop();
        return this;
    }

    ready() {
        const address = this.address();
        this.register().then(result => {
            // console.log('RESULT', result.data)
            const key = result && result.data && result.data.key;
            console.log(`\nService: ${this.name} \nRunning: http://${address.ip}:${address.port} \nKey: ${key}`);
        }).catch(e => {
            console.log('Registration failed:', e);
            throw e;
        });
    }
    
    async register() {
        const registerUrl = `http://localhost:3001/registry/${this.name}/${this.version}/${this.port}`;
        // console.log('Registering: PUT', registerUrl);
        try {
            const resp = await axios.put(registerUrl);
            const { data } = await resp;
            if (!data.success) {
                throw new Error(`Registration for ${this.name} service failed`);
            }
            return data;
        } catch (e) {
            console.log('registration failed:', e);
            throw e;
        }
    }

    error(error) {
        console.log('error', error);
    }

    running() {
        return this.server.running
    }

    address() {
        let { address, ip, host, family, port } = this.server.address();

        this.host    = require('os').hostname().toLowerCase();
        this.ip      = this.toIPv4(address);
        this.port    = port;
        this.address = address;
        this.family  = family;

        return { 
            host: this.host, 
            ip: this.ip, 
            port: this.port, 
            address: this.address, 
            family: this.family 
        };
    }

    toIPv4(address) {
        var ip = address;
        if (ip.substr(0, 7) == "::ffff:") {
            ip = ip.substr(7);
        } else if (ip === '::') {
            ip = '127.0.0.1';
        }
        return ip;
    }
}

module.exports = Server;