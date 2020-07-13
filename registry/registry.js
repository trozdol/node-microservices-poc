const semver = require('semver');
const { service } = require('../api');

class Registry {
    timeout;
    services = {};

    constructor(timeout = 60) {
        this.timeout = timeout;
    }

    key(name, version, ip, port) {
        return `${name}_${version}_${ip}_${port}`.toUpperCase();
    }

    get(name, version) {
        this.expire();

        console.log('get', {name, version});

        var services = Object.values(this.services);

        services = name 
            ? services.filter(service => (service.name === name))
            : services;
        
        services = version 
            ? services.filter(service => semver.satisfies(service.version, version))
            : services;

        return services[Math.floor(Math.random() * services.length)];
    }

    register(name, version, ip, port) {
        this.expire();

        console.log('register', ' - ', {name, version, ip, port});

        const key = this.key(name, version, ip, port);
        
        if (!this.services.key) {
        
            this.services[key] = {
                key: key,
                timestamp: Math.floor(new Date()/1000),
                name: name,
                version: version,
                ip: ip,
                port: port,
            };
            console.log(`Registered service ${key}`);        
        } else {
            this.services[key].timestamp = Math.floor(new Date()/1000);
            console.log(`Updated service ${key}`);
        }
        return this.services[key];
    }

    unregister(name, version, ip, port) {
        console.log('unregister', ' - ', __filename);
        const key = this.key(name, version, ip, port);
        delete this.services[key];
        console.log(`Unregistered service: ${key}`);
        return key;
    }

    expire() {
        console.log('expire', ' - ', __filename);
        const now = Math.floor(new Date() / 1000);
        Object.keys(this.services).forEach(key => {
            const { timestamp, name, version, ip, port } = this.services[key];
            if (timestamp + this.timeout < now) {
                this.unregister(name, version, ip, port);
            }
        })
    }
}

module.exports = Registry;