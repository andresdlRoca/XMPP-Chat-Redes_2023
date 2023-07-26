const express = require('express');
const net = require('net');
const readline = require('readline');

app = express();

const serverData = {
    domain: "alumchat.xyz",
    port: 5222
};

let userCredentials = {
    username: 'testeo20332',
    password: '123456789'
};

const client = new net.Socket();


function connectToServer() {
    client.connect(serverData.port, serverData.domain, () => {
        console.log('Connected');
        client.write(`<stream:stream to="${serverData.domain}" xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams" version="1.0">`);
    });

    client.on('data', data=> {
        console.log(data.toString());
    });
};

function sendCredentials() {
    client.write(`<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">${Buffer.from(`\u0000${userCredentials.username}\u0000${userCredentials.password}`).toString('base64')}</auth>`);
};

connectToServer();

