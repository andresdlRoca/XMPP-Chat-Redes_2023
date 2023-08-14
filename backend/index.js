const express = require('express');
const readline = require('readline');
const { client, xml } = require("@xmpp/client");
const debug = require("@xmpp/debug");
const { join } = require("path");
const net = require("net");
const netClient = require("net").Socket();
const fetch = require("node-fetch");

app = express();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

class Client_XMPP {
    constructor(username, password, service = "xmpp://alumchat.xyz:5222", domain = "alumchat.xyz") {
        this.username = username;
        this.password = password;
        this.service = service;
        this.domain = domain;
        this.xmpp = null;
        this.loginState = false;
        this.MAX_LENGTH = 100;
        this.messages = [];
        this.receivedSubscriptions = [];
        this.receivedGroupChatInvites = [];
    }


    showMenu = async() => {
        const rl = readline.createInterface({
            input : process.stdin,
            output : process.stdout
        });

        console.log(`\nCurrent User: ${this.username}`);
        console.log('\nMenu:');
        console.log('1. Send Message'); //DONE
        console.log('2. Delete account from server'); //PENDING
        console.log('3. Show contacts and their info');//DONE
        console.log('4. Add users as contacts'); //TODO: Subscription list
        console.log('5. Show details of a user'); //DONE
        console.log('6. Group chatting'); // PENDING
        console.log('7. Set presence message'); //DONE
        console.log('8. Send/Receive files');// PENDING
        // TODO: Enviar/Recibir archivos
        console.log('9. Send/Receive Notifications'); //PENDING

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
                case '3': // Show all contacts and their status
                    await this.mostrarUsuarios();
                    await this.showMenu();
                    break;
                case '4': // Add user to contacts
                    
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
                case '5': // Show user details
                    rl.question("Enter the user you want to see the details of: ", async(user) => {
                        await this.showUserDetails(user);
                        rl.close();
                    });
                    break;
                case '6': // Group conversation
                    console.log("Not implemented yet");
                    rl.close();
                    await this.showMenu();
                    break;
                case '7': // Set presence message
                    rl.question("Enter your presence state: ", async(presenceState) => {
                        rl.question("Enter your presence message: ", async(message) => {
                            await this.setPresenceMessage(presenceState, message);
                            rl.close();
                        });
                    });
                    break;
                case '8': // Send/Receive files
                    console.log("Not implemented yet");
                    rl.close();
                    await this.showMenu();
                    break;
                case '9': // Send/Receive notifications
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
            if(err.condition == "not-authorized") {
                console.error("Error while logging in");
            };
        });

        this.xmpp.on("online", async () => {
            await this.xmpp.send(xml("presence", {type: "online"}));

            this.xmpp.on("stanza", (stanza) => {
                if(stanza.is('message') && stanza.attrs.type == 'chat') {
                    const from = stanza.attrs.from;
                    const body = stanza.getChildText("body");
                    const message = {from, body};

                    if (body) {
                        console.log(`Received message from ${from.split('@')[0]}:`, body);
                    }
                }

                else if (stanza.is('presence') && stanza.attrs.type === 'subscribe') {
                    const from = stanza.attrs.from;
                    this.receivedSubscriptions.push(from);
                    console.log("Received subscription request from:", from.split('@')[0]);
                    console.log("Request message:", stanza.getChildText("status"));
                }
                
                else if (stanza.is('message') && stanza.attrs.from.includes('@conference.alumchat.xyz')) {
                    const groupchat = stanza.attrs.from
                    const to = stanza.attrs.to                    
            
                    this.receivedGroupChatInvites.push(groupchat)
            
                    // Si el to no tiene una diagonal, entonces se imprime la invitación.
                    if (!to.includes('/')) {
                      console.log("Group chat invitation from: ", groupchat)
                    }
                }
                
            });

        });

        await this.xmpp.start().then(()=> {this.loginState = true}).catch((err) => {
            if(err.condition == "not-authorized") {
                console.error("This user may not exist in the server. Please try again.");
            };
        });
    };

    async addContacts(jid) {

        const presence = xml("presence", {type: "subscribe", to: jid + "@alumchat.xyz"});
        this.xmpp.send(presence).then(() => {
            console.log("Contact request sent to: ", jid);
            this.showMenu();
        }).catch((err) => {
            console.error("Error when adding contact: ", err);
        });
    };

    async showUserDetails(jid) {
        const username = jid + "@alumchat.xyz";

        this.xmpp.on("stanza", (stanza) => {
            if(stanza.is("iq") && stanza.attrs.type === "result") {
                const users = stanza.getChild("query", "jabber:iq:roster").getChildren('item');
                const user = users.find((user) => user.attrs.jid === username);
                if(user) {
                    const jid = user.attrs.jid;
                    const name = user.attrs.name;
                    const subscription = user.attrs.subscription;
                    console.log("Contact:", jid, "Name:", name, "Subscription:", subscription);
                } else {
                    console.log("User not found");
                }

                this.showMenu();
            }
        });

        const requestContacts = xml(
            "iq",
            {type: "get", id: "roster"},
            xml("query", {xmlns: "jabber:iq:roster"})
        );

        this.xmpp.send(requestContacts)
        .then(() => {
            console.log("Requesting Contacts...");
        }).catch((err) => {
            console.error("Error when requesting contacts: ", err);
        });

    };

    async showSubscriptionsRequests() {
        // TODO: Implementar array que guarde las solicitudes de contacto
    };

    async setPresenceMessage(presenceState, message) {
        const presence = xml("presence", {}, xml('show', {}, presenceState), xml('status', {}, message));
        await this.xmpp.send(presence);

        console.log("Presence status and message set to: ", presenceState, message);
        this.showMenu();
    };

    async mostrarUsuarios() {
        const requestContacts = xml(
            "iq",
            {type: "get", id: "roster"},
            xml("query", {xmlns: "jabber:iq:roster"})
        );

        this.xmpp.send(requestContacts)
        .then(() => {
            console.log("Requesting Contacts...");
        }).catch((err) => {
            console.error("Error when requesting contacts: ", err);
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
                        console.log("Contact:", jid, "Name:", name, "Subscription:", subscription);
                    } else {
                        console.log("Contact:", from, "Show:", show, "Status:", status);
                    }

                })
            }
            });
    };

    async registerUser(username, password) {
        netClient.connect(5222, 'alumchat.xyz', function() {
            netClient.write("<stream:stream to='alumchat.xyz' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>");
        });

        netClient.on('data', async(data) => {
            if(data.toString().includes("<stream:features>")) {
                const register = `
                <iq type="set" id="reg_1" mechanism='PLAIN'>
                <query xmlns="jabber:iq:register">
                  <username>${username}</username>
                  <password>${password}</password>
                </query>
              </iq>
              `;
                await netClient.write(register);
            } else if(data.toString().includes('<iq type="result"')) {
                console.log("User registered into server");
                this.registerState = true;

            } else if(data.toString().includes('<iq type="error"')) {
                console.log("XMPP Server error");
            }
        });

        netClient.on('close', function() {
            console.log('Connection closed');
        });
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
    loginMenu();
    // const client = new Client_XMPP("andres2002", "andres2002");
    // await client.connect();
    // client.showMenu();
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
                        try {
                            await client.connect();
                        } catch (error) {
                            console.log("Error logging in");
                            rl.close();
                            loginMenu();
                        }
                        if(client.loginState == false) {
                            console.log("Error logging in");
                            rl.close();
                            loginMenu();
                        } else if (client.loginState == true) {
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
                        try {
                            await client.registerUser(client.username, client.password);
                            loginMenu();
                        } catch (error) {
                            console.log("Error registering user");
                            rl.close();
                            loginMenu();
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
