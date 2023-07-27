const express = require('express');
const net = require('net');
const readline = require('readline');

app = express();

class User {
    constructor(username, password, domain) {
        this.username = username;
        this.password = password;
        this.userWithDomain = domain;
    }
}

class ServerData {
    constructor(domain, port) {
        this.domain = domain;
        this.port = port;
    }
}

class Client_XMPP {
    constructor(User, ServerData) {
        this.client = new net.Socket();
        this.loggenIn = false;
        this.user = User;
        this.serverData = ServerData;
    };

    showMenu = (user) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    
        console.log(`\nCurrent User: ${user.userWithDomain}`)
        console.log('\nMenu:');
        //Account administration
        console.log('1. Send Message');
        console.log('2. Close Session');
        console.log('3. Register new user'); // Not sure if this should go here
        console.log('4. Exit'); // Exit  - TODO: Will go down as I add more options
    
        // Communication with others - WIP
    
        // Menu options
        rl.question('Select an option: ', async(answer) => {
            switch(answer) {
                case '1':
                    await this.sendMessage(this.client, this.user);
                    break;
                case '2':
                    this.closeSession();
                    break;
                case '3':
                    this.registerNewUser();
                    break;
                case '4':
                    console.log("Exiting...");
                    this.client.end();
                    rl.close();
                    break;
                default:
                    console.log('Invalid option');
                    this.showMenu();
                    break;
            }
        });
    }

    //TODO: Add a way to register a new user
    /*
        Manages the initial connection to the server
    */
    connectToServer = () => {
        this.client.connect(this.serverData.port, this.serverData.domain, () => {
            console.log('Connected');
            this.client.write(`<stream:stream to="${this.serverData.domain}" xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams" version="1.0">`);
        });

        this.client.on('data', (data) => {
            this.sendCredentials(data);
        });
    
        this.client.on('close', () => {
            console.log('Connection closed');
        });
    
        this.client.on('error', (err) => {
            console.log('Error: ', err);
        });
    
        this.client.on('end', () => {
            console.log('Connection ended');
        });
    };

    sendCredentials = async(data) => {
        const incomingData = data.toString();

        if(incomingData.includes('stream:features') && !this.loggenIn) {
            console.log("Requesting access...")
            // console.log(incomingData);
            await this.requestAccess(this.client, this.user);
        } else if(incomingData.includes('success')) {
            console.log('Logged in');
            this.loggenIn = true;
            // console.log('Incoming data: ', incomingData)
            // const streamIdRegex = /<stream:stream.* id=['"](.*?)['"].*>/;
            // const match = incomingData.match(streamIdRegex);
            // if(match && match[1]) {
            //     streamId = match[1];
            //     console.log('Streamid:', streamId)
            //     const bindingRequest = `<iq type="set" id="${streamId}"><bind xmlns="urn:ietf:params:xml:ns:xmpp-bind"><resource>alumchat</resource></bind></iq>`;
            //     client.write(bindingRequest);
            // } 

            this.showMenu(this.user);
            // client.write(`<stream:stream to="${serverData.domain}" xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams" version="1.0">`);
        } else if(incomingData.includes('failure')){
            console.log('Wrong credentials, Authentication failed');
            console.log('Error: ', incomingData);
        } else if(this.loggenIn && incomingData.includes("iq")) {
            console.log('Incoming data:iq ', incomingData)
        } else if(incomingData.includes("?xml version='1.0'")) {
            // DO NOTHING
        } else { //TODO: Add a way to manage first message when logging in.
            console.log('Something went wrong');
            console.log('Response: ', incomingData);
            if(this.loggenIn) {
                this.showMenu(this.user);
            }
        }
    };

    sendMessage = async(client, user) => {
    // const rl = readline.createInterface({
    //     input: process.stdin,
    //     output: process.stdout
    // });

     // rl.question('To: ', (answer) => {
    //     const to = answer;
    //     rl.question('Message: ', (answer) => {
    //         const message = answer;
    //         rl.close();
    //     });
    // });
        let to = 'gon20362@alumchat.xyz';
        let message = 'Hola desde el Codigo';
        console.log(user.userWithDomain);
        try {
            client.write(`<message 
                to="${to}" 
                from="${user.userWithDomain}" 
                type="chat" 
                xmlns="jabber:client"><body>${message}</body></message>`);
        } catch (error) {
            console.log('Error: ', error);
        }

    };

    requestAccess = async(client, userCredentials) => {
        client.write(`<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">${Buffer.from(`\u0000${userCredentials.username}\u0000${userCredentials.password}`).toString('base64')}</auth>`)
    };

}

// Running client
const user = new User('andres20332', 'andres20332', 'andres20332@alumchat.xyz');
const serverData = new ServerData('alumchat.xyz', 5222);
const client = new Client_XMPP(user, serverData);
client.connectToServer();


// ---- CODIGO CON LIBRERIA @XMPP/Client ---- 

// const { client, xml } = require("@xmpp/client");
// const debug = require("@xmpp/debug");

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// class ClienteXMPP {
//   constructor(username, password, service = "xmpp://alumchat.xyz:5222", domain = "alumchat.xyz") {
//     this.username = username;
//     this.password = password;
//     this.service = service;
//     this.domain = domain;
//     this.xmpp = null;
//   }

//   async conectar() {
//     this.xmpp = client({
//       service: this.service,
//       domain: this.domain,
//       username: this.username,
//       password: this.password,
//     });


//     this.xmpp.on("error", (err) => {
//       console.error(err);
//     });

//     this.xmpp.on("online", async () => {
//       await this.xmpp.send(xml("presence"));
//     });

//     await this.xmpp.start().catch(console.error);
//   }

//   async enviarMensaje(destinatario, mensaje) {
//     if (!this.xmpp) {
//       throw new Error("El cliente XMPP no está conectado. Primero llama al método 'conectar()'.");
//     }

//     const message = xml(
//       "message",
//       { type: "chat", to: destinatario },
//       xml("body", {}, mensaje)
//     );

//     await this.xmpp.send(message);
//   }
// }

// // Ejemplo de uso de la clase ClienteXMPP para enviar un mensaje
// async function ejemploEnviarMensaje() {
//   const cliente = new ClienteXMPP("andres20332", "andres20332");
//   await cliente.conectar();

//   const destinatario = "gon20362@alumchat.xyz"; // Reemplaza "otroUsuario" con el nombre de usuario del destinatario
//   const mensaje = "Mensaje enviado desde el codigo"; // Mensaje que deseas enviar
//   await cliente.enviarMensaje(destinatario, mensaje);
//   console.log("Mensaje enviado correctamente.");
// }

// ejemploEnviarMensaje().catch((error) => {
//   console.error("Error al enviar el mensaje:", error);
// });