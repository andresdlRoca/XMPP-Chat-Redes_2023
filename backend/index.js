const express = require('express');
const net = require('net');
const readline = require('readline');

app = express();

const serverData = {
    domain: "alumchat.xyz",
    port: 5222
};

let userCredentials = {
    username: 'andres20332',
    password: 'andres20332',
    userWithDomain: 'andres20332@alumchat.xyz'
};

const client = new net.Socket();
let loggenIn = false;

const showMenu = () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log(`\nCurrent User: ${userCredentials.userWithDomain}`)
    console.log('\nMenu:');
    console.log('1. Send Message');
    console.log()

}


//TODO: Add a way to register a new user
function connectToServer() {
    client.connect(serverData.port, serverData.domain, () => {
        console.log('Connected');
        client.write(`<stream:stream to="${serverData.domain}" xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams" version="1.0">`);
    });

    client.on('data', data=> {
        sendCredentials(client, data);
    });

    client.on('close', () => {
        console.log('Connection closed');
    });

    client.on('error', (err) => {
        console.log('Error: ', err);
    });

    client.on('end', () => {
        console.log('Connection ended');
    });

};

function sendCredentials(client, data) {
    const incomingData = data.toString();

    if(incomingData.includes('stream:features') && !loggenIn) {
        console.log("Requesting access...")
        // console.log(incomingData);
        requestAccess(client);
    } else if(incomingData.includes('success')) {
        console.log('Logged in');
        // client.write('</stream:stream>');
        loggenIn = true;
        showMenu();
        // client.write(`<stream:stream to="${serverData.domain}" xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams" version="1.0">`);
    } else if(incomingData.includes('failure')){
        console.log('Wrong credentials, Authentication failed');
        console.log('Error: ', incomingData);
    } else { //TODO: Add a way to manage first message when logging in.
        console.log('Something went wrong');
        console.log('Response: ', incomingData);

    }
};

async function requestAccess(client) {
    Promise.resolve(client.write(`<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">${Buffer.from(`\u0000${userCredentials.username}\u0000${userCredentials.password}`).toString('base64')}</auth>`));
};

connectToServer();

