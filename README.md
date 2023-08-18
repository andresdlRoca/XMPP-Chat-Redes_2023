# XMPP Client
This project aims to develop an XMPP (Extensible Messaging and Presence Protocol) client that aligns with the already established standards by this protocol.
The primary objectives of this project include:

- Protocol Implementation: This project focuses on creating a basic but functional XMPP client that works using a CLI, it adheres to the specifications set by the XMPP standards, ensuring its compatibility with other XMPP servers and clients.
- Understanding XMPP's purpose: The project delves into comprehending the core purpose of the protocol, this basically entails gaining a deep understanding of how the XMPP facilitates real-time messaging and enabling effective communication over the internet, focusing on what's going on behind the scenes as it the project is developed.
- Services of XMPP Protocol: This project focuses on various of the services provided by the XMPP protocol. This involves functionalities such as 1 on 1 messaging, group chatting, presence tracking, subscription notifications, file sending, etc. By developing these services we can gain a far better understanding of how this protocol works, understanding its capabilities and limitations on the way.
- Asynchrounous Programming Fundamentals: To address the network development requirements, the project will involve the utilization of asynchronous programming practices as to ensure our client is responsive and efficient when using the different features

By successfully achieving these general objectives, the project aims to deliver a fully functional XMPP client that can serve to comprehend better the workings of the XMPP protocol, its underlying services and the programming techniques required to develop network applications/communication solutions.

## Features
### Account Administration
1. Account registering
2. Account login
3. Account sign out
4. Account deletion
### Communication between accounts
1. Show user's contacts and their info
2. Add contacts to user's contacts via subscription
3. Show details of an specific contact
4. 1 on 1 communication between any user/contact
5. Group chatting between users
6. Setting a presence message and status
7. Receive and send notifications
8. Receive and send files

## Prerequisites
- node v16.15.^

## Dependencies
- @xmpp/client ^0.13.1
- @xmpp/debug ^0.13.0
- dotenv 16.3.1
- net ^1.0.2

## Usage
First in the command line, inside the backend directory, install the dependencies via
```
npm install
```

And then run the project via
```
npm run start
```


The project works through the use of a CLI, it revolves around option selection in such a way that the user must enter the prompt they are asked for.
Ex.
```
--- Login Menu ---  
1. Login  
2. Register new user  
3. Exit  
(Prompt)
```
```
Current user: Testuser

Menu:
1. Send Message
2. Delete account from server
3. Show contacts and their info
4. Add users as contacts
5. Show details of a user
6. Group chatting
7. Set presence message
8. Send/Receive files
9. Close Session
Select an option:
```

The client usually asks the user for a certain prompt in the submenus if necessary, if this either isn't the correct one or causes an error the user will be sent to the main menu. This makes sure the interface is intuitive and a guided experience for the user.

For group chatting there are two useful "commands" since the client doesn't explicitly asks for prompts at that stage, those being:
- /exit
Which exits the group chat the user joined.  

- /invite {user}
This one can be used to invite other users by only typing in their username after the "/invite" prompt.

Other than these reserved commands the user can type normally and a message will be sent to the group chat.

## Author  
👤 Andrés de la Roca  
- <a href = "https://www.linkedin.com/in/andr%C3%A8s-de-la-roca-pineda-10a40319b/">Linkedin</a>  
- <a href="https://github.com/andresdlRoca">Github</a> 