# Responsive Chatroom - Monster Bash

*Monster bash* is a web application in which users can log into a server and chat in real time with friends.

## Features

The application includes the following features:

- [x] Sign-up and log-in 
  - In the home page of the website, the user can create an account or log in with an existing account.
  - Users can select a username, password, and a character option.
  - After signing up, the user can then sign in with the same credentials later.
- [x] PostgreSQL database integration 
  - The application is integrated with a PostgreSQL database that is updated in real time.
  - Log-in information, character choice, text message, and current position are stored in the database.
  - Passwords are encrypted to ensure user privacy.
- [x] Real-time chat messaging and movement
  - Users can use a text box to send a message that will appear on screen to all logged-in users for 5 seconds.
  - Users can click to move their character around the map, as well as see other characters' movements.
- [x] User can log out via a button:
  - The Log Out button allows a user to og out from their account.
  - The user will disconnect from the server and their character will no longer be visible to other users.
- [x] Real-time data sharing between users:
  - SocketIO provides simultaneous real time injection and fetching of all connected users' data into the database.
  - Deployed using Render.

## Video Walkthrough

<img src='./misc/signup.gif'>

<img src='./misc/gameplay.gif'>

## License

    Copyright 2024 [name of copyright owner]

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
