const express = require('express');
const readline = require('readline');
const { client, xml } = require("@xmpp/client");
const debug = require("@xmpp/debug");

app = express();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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

        //Account administration
        console.log('3. Close Session'); // Exit  - TODO: Will go down as I add more options

        // Communication with others - WIP

        //Menu options
        rl.question('Select an option: ', async(answer) => {
            switch(answer) {
                case '1':
                    rl.question('Enter the user you want to send the message to: ', (user) => {
                        rl.question('Enter the message you want to send: ', async(message) => {
                            await this.sendMessage(user, message);
                            rl.close();
                            await this.showMenu();
                        });
                    });
                    break;
                case '2':
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
                case '3':
                    this.registerUser();
                    break;
                case '4':
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
        });

        this.xmpp.on("error", (err) => {
            console.error(err);
        });

        this.xmpp.on("online", async () => {
            await this.xmpp.send(xml("presence"));
        });

        await this.xmpp.start();
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
    loginMenu();
    // const client = new Client_XMPP("andres20332", "andres20332");
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
                return;
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
