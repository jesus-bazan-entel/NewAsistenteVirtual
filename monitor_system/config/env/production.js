'use strict';

module.exports = {
    port: process.env.PORT || 8082,
    portHttps: 8443,
    host: '0.0.0.0',
    asterisk: {
        'host': process.env.ASTERISK_HOST || 'localhost',
        'port': process.env.ASTERISK_PORT || 5038,
        'user': process.env.ASTERISK_USER || 'asterisk',
        'secret': process.env.ASTERISK_PASSWORD || ''
    },
    log: {
        format: 'combined',
        options: {
            stream: 'logs/access.log'
        }
    },
    app: {
        title: 'NewIp Monitor - Production'
    },
};
