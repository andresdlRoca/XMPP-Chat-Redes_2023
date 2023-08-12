const express = require('express');
const readline = require('readline');
const { client, xml } = require("@xmpp/client");
const debug = require("@xmpp/debug");
const { join } = require("path");
const net = require("net");
const fetch = require("node-fetch");

app = express();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const MAX_LENGTH = 50;

class Client_XMPP {
    constructor(username, password, service = "xmpp://alumchat.xyz:5222", domain = "alumchat.xyz") {
        this.username = username;
        this.password = password;
        this.service = service;
        this.domain = domain;
        this.xmpp = null;
    }

    showMenu = async() => {
        const rl = readline.createInterface({
            input : process.stdin,
            output : process.stdout
        });

        console.log(`\nCurrent User: ${this.username}`);
        console.log('\nMenu:');
        console.log('1. Send Message');
        console.log('2. Delete account from server');
        console.log('3. Register new user');
        console.log('4. Mostrar todos los contactos y su estado');
        console.log('5. Agregar un usuario a los contactos');
        console.log('6. Mostrar detalles de un usuario');
        console.log('7. Mensaje directo');
        console.log('8. Conversacion grupal');
        console.log('9. Definir mensaje de presencia');
        // TODO: Enviar/Recibir notificaciones y archivos

        //Account administration
        console.log('10. Close Session'); // Exit  - TODO: Will go down as I add more options

        // Communication with others - WIP

        //Menu options
        rl.question('Select an option: ', async(answer) => {
            switch(answer) {
                case '1': // Send message
                    rl.question('Enter the user you want to send the message to: ', (user) => {
                        rl.question('Enter the message you want to send: ', async(message) => {
                            await this.sendMessage(user, message);
                            rl.close();
                            await this.showMenu();
                        });
                    });
                    break;
                case '2': // Delete account
                    rl.question("Are you sure about this? (y/n): ", async(choice) => {
                        if(choice == 'y') {
                            console.log("Deleting account...");
                            console.log("But not yet actually...");
                            rl.close();
                            await loginMenu();
                        } else {
                            rl.close();
                            await this.showMenu();
                        }
                    });
                    break;
                case '3': // Register new user
                    this.registerUser();
                    break;
                case '4': // Show all contacts and their status
                    await this.mostrarUsuarios();
                    await this.showMenu();
                    break;
                case '5': // Add user to contacts
                    
                    console.log("1. Agregar usuario a contactos");
                    console.log("2. Aceptar solicitudes pendientes");
                
                    rl.question("Elige tu opcion: ", async(answer) => {

                        switch (answer) {
                            case '1': // Add user to contacts
                                rl.question("Enter the user you want to add: ", async(user) => {
                                    await this.addContacts(user);
                                    rl.close();
                                    await this.showMenu();
                                });
                                break;
                            case '2': // Accept pending requests
                                console.log("Not implemented yet");
                                rl.close();
                                await this.showMenu();
                                break;
                            default:
                                console.log("Invalid option");
                                rl.close();
                                await this.showMenu();
                                break;
                        };
                    });
                    break;
                case '6': // Show user details
                    console.log("Not implemented yet");
                    rl.close();
                    await this.showMenu();
                    break;
                case '7': // Direct message
                    console.log("Not implemented yet");
                    rl.close();
                    await this.showMenu();
                    break;
                case '8': // Group conversation
                    console.log("Not implemented yet");
                    rl.close();
                    await this.showMenu();
                    break;
                case '9': // Set presence message
                    console.log("Not implemented yet");
                    rl.close();
                    await this.showMenu();
                    break;
                case '10':
                    console.log("Exiting...");
                    const disconnect = async() => {
                        await this.xmpp.send(xml("presence", {type: "unavailable"}))
                        await this.xmpp.stop();
                        rl.close();
                    }
                    loginMenu();
                    break;
                default:
                    console.log('Invalid option');
                    rl.close();
                    await this.showMenu();
                    break;
            };
        });

    };

    async connect() {
        this.xmpp = client({
            service: this.service,
            domain: this.domain,
            username: this.username,
            password: this.password,
            terminal: true,
            tls: {
                rejectUnauthorized: false
            },
        });

        this.xmpp.on("error", (err) => {
            console.error(err);
        });

        this.xmpp.on("online", async () => {
            await this.xmpp.send(xml("presence", {type: "available"}));
        });

        await this.xmpp.start();
    };

    async addContacts(jid) {

        const presence = xml("presence", {type: "subscribe", to: jid + "@alumchat.xyz"});
        this.xmpp.send(presence).then(() => {
            console.log("Solicitud de contacto enviada a: ", jid);
            this.showMenu();
        }).catch((err) => {
            console.error("Error al agregar contacto: ", err);
        });
    };

    async showSubscriptionsRequests() {
        // TODO: Implementar array que guarde las solicitudes de contacto
    };

    async mostrarUsuarios() {
        const requestContacts = xml(
            "iq",
            {type: "get", id: "roster"},
            xml("query", {xmlns: "jabber:iq:roster"})
        );

        this.xmpp.send(requestContacts)
        .then(() => {
            console.log("Solicitando contacos...");
        }).catch((err) => {
            console.error("Error al solicitar contactos: ", err);
        });

        this.xmpp.on("stanza", (stanza) => {
            if (stanza.is("iq") && stanza.attrs.type === "result") {
                const contacts = stanza.getChild("query", "jabber:iq:roster").getChildren('item');
                
                console.log("Lista de contactos: ");
                contacts.forEach((contact) => {
                    console.log("JID", contact.attrs.jid);
                    console.log("Name", contact.attrs.name);
                    console.log("Subscription", contact.attrs.subscription);
                });

                this.xmpp.on("presence", (presence) => {
                    const from = presence.attrs.from;
                    const show = presence.getChild("show");
                    const status = presence.getChild("status");

                    const contact = contacts.find((contact) => contact.attrs.jid === from);
                    if(contact) {
                        const jid = contact.attrs.jid;
                        const name = contact.attrs.name;
                        const subscription = contact.attrs.subscription;
                        console.log("Contacto:", jid, "Name:", name, "Subscription:", subscription);
                    } else {
                        console.log("Contacto:", from, "Show:", show, "Status:", status);
                    }

                })
            }
            });
    };

    async registerUser() {
        this.xmpp = client({
            service: this.service,
            domain: this.domain,
            username: this.username,
            password: this.password,
        });

        this.xmpp.reconnect.stop();
        this.xmpp.timeout = 5000;

        this.xmpp.on("online", async (address) => {
            console.log("Online!");
            await this.xmpp.iqCaller.request(
              xml('iq', {type: 'get', to: 'alumchat.xyz'},
                xml('query', {xmlns: 'jabber:iq:register'})
              )
            );
            await this.xmpp.iqCaller.set(
              xml("query", {xmlns: "jabber:iq:register"},
                xml("username", {}, `"${this.username}"`),
                xml("password", {}, `"${this.password}"`),
                xml("email", {}, "email@email.com")
              ),
              'alumchat.xyz'
            )
          });
        
        this.xmpp.on("status", (status) => {
            console.debug("status", status);
        });

        this.xmpp.on("stanza", async (stanza) => {
            console.log("Incoming stanza: ", stanza.toString());
        });

        this.xmpp.on("error", (err) => {
            console.error(err);
        });



        await this.xmpp.start();
    }

    async sendMessage(destinatario, mensaje) {
        if (!this.xmpp) {
        throw new Error("El cliente XMPP no está conectado. Primero llama al método 'connect()'.");
        };

        const message = xml(
        "message",
        { type: "chat", to: destinatario + "@alumchat.xyz" },
        xml("body", {}, mensaje)
        );

        await this.xmpp.send(message);
    };

};

async function main() {
    // loginMenu();
    const client = new Client_XMPP("andres2002", "andres2002");
    await client.connect();
    client.showMenu();
};

async function loginMenu() {
    const rl = readline.createInterface({
        input : process.stdin,
        output : process.stdout
    });

    console.log("\n--- Login Menu ---");
    console.log("1. Login");
    console.log("2. Register new user");
    console.log("3. Exit");

    rl.question("Select an option: ", (answer) => {
        switch(answer) {
            case '1':
                rl.question("Enter your username: ", (username) => {
                    rl.question("Enter your password: ", async(password) => {
                        const client = new Client_XMPP(username, password);
                        let loginState = false
                        try {
                            await client.connect();
                            loginState = true;
                        } catch (error) {
                            console.log("Error logging in");
                            rl.close();
                            loginMenu();
                        }
                        if(loginState == true) {
                            console.log("Logged in succesfully");
                            rl.close();
                            client.showMenu();
                        }



                    });
                });
                break;
            case '2':
                rl.question("Enter your username: ", (username) => {
                    rl.question("Enter your password: ", async(password) => {
                        const client = new Client_XMPP(username, password);
                        let registerState = false;
                        try {
                            await client.registerUser();
                            registerState = true;
                        } catch (error) {
                            console.log("Error registering user");
                            rl.close();
                            loginMenu();
                        }
                        if(registerState == true) {
                            console.log("User registered succesfully");
                            await client.connect();
                            rl.close();
                            client.showMenu();
                        }
                    });
                });
                break;
            case '3':
                console.log("Exiting...");
                rl.close();
                break;
            default:
                console.log("Invalid option");
                rl.close();
                loginMenu();
                break;
        }
    });
}

main().catch((error) => {
    console.error("Error al enviar el mensaje:", error);
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
