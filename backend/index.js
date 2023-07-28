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

    showMenu = () => {
        const rl = readline.createInterface({
            input : process.stdin,
            output : process.stdout
        });

        console.log(`\nCurrent User: ${this.username}`);
        console.log('\nMenu:');
        console.log('1. Send Message');
        console.log('2. Delete account from server')

        //Account administration
        console.log('3. Close Session'); // Exit  - TODO: Will go down as I add more options

        // Communication with others - WIP

        //Menu options
        rl.question('Select an option: ', (answer) => {
            switch(answer) {
                case '1':
                    rl.question('Enter the user you want to send the message to: ', (user) => {
                        rl.question('Enter the message you want to send: ', async(message) => {
                            await this.sendMessage(user, message);
                            this.showMenu();
                        });
                    });
                    break;
                case '2':
                    console.log("Deleting account...");
                    console.log("But not yet actually...");
                    rl.close();
                    this.showMenu();
                case '3':
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
                    this.showMenu();
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

    await this.xmpp.start().then(console.log("--- Logged in succesfully ---")).catch(console.error);
  };

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

async function registerUser(username, password) {
    const client = new Client_XMPP(username, password);
    await client.connect();
    client.showMenu();
}

async function main() {
    const client = new Client_XMPP("andres20332", "andres20332");
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
                        await client.connect();
                        client.showMenu();
                    });
                });
                break;
            case '2':
                rl.question("Enter your username: ", (username) => {
                    rl.question("Enter your password: ", async(password) => {
                        const client = new Client_XMPP(username, password);
                        await client.connect();
                        registerUser(username, password);
                    });
                });
                break;
            case '3':
                console.log("Exiting...");
                rl.close();
                break;
            default:
                console.log("Invalid option");
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
