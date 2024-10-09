// app.js
window.onload = function () {
  // Global variables
  let socket;
  let otherUsers = {};

  // Function to show the map and hide the forms
  function showMap() {
    document.getElementById('map-container').style.display = 'block';
    document.getElementById('message-container').style.display = 'flex';
    document.getElementById('logout-button').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-title').style.display = 'none';
    document.getElementById('login-title').style.display = 'none';

    // Set character image based on user data
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.character_choice) {
      const characterImg = document.getElementById('character-img');
      characterImg.src = `assets/${user.character_choice}.gif`;

      // Set the username below the character
      const usernameDiv = document.getElementById('username');
      usernameDiv.textContent = user.username; // Set the username from localStorage
    } else {
      // Fallback to default character if character_choice is not available
      const characterImg = document.getElementById('character-img');
      characterImg.src = `assets/char1.gif`;
      const usernameDiv = document.getElementById('username');
      usernameDiv.textContent = "Default User"; // Fallback username
    }

    // Initialize Socket.io connection to your backend URL
    socket = io('https://monster-bash.onrender.com');

    // Emit 'init' event to the server with user data
    socket.emit('init', {
      username: user.username,
      character_choice: user.character_choice,
      position: { x: 100, y: 100 }, // Default initial position
    });

    // Set up event listeners for incoming data
    setupSocketListeners();
  }

  // Function to show the forms and hide the map
  function showForms() {
    document.getElementById('map-container').style.display = 'none';
    document.getElementById('message-container').style.display = 'none';
    document.getElementById('logout-button').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-title').style.display = 'block';
    document.getElementById('login-title').style.display = 'block';
  }

  // Check if the user is already logged in on page load
  window.onload = function () {
    const user = localStorage.getItem('user');
    if (user) {
      showMap(); // Show the map if the user is already logged in
    }
  };

  // Handle sign-up form submission
  document.getElementById('signup-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const character_choice = document.getElementById('signup-character').value;

    // Send request to the backend using your deployed backend URL
    const response = await fetch('https://monster-bash.onrender.com/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, character_choice }),
    });

    const data = await response.json();
    if (response.ok) {
      // Store user information in localStorage to persist the session
      localStorage.setItem('user', JSON.stringify(data.user));
      showMap(); // Show the map after successful sign-up
      alert('Account created successfully!');
    } else {
      alert('Error: ' + data.message);
    }
  });

  // Handle login form submission
  document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Send request to the backend using your deployed backend URL
    const response = await fetch('https://monster-bash.onrender.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
      // Store user information in localStorage to persist the session
      localStorage.setItem('user', JSON.stringify(data.user));
      showMap(); // Show the map after successful login
      alert('Login successful!');
    } else {
      alert('Error: ' + data.message);
    }
  });

  // Handle logout button click
  document.getElementById('logout-button').addEventListener('click', function () {
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      // Remove user data from localStorage
      localStorage.removeItem('user');

      // Reload the page to reset the state
      location.reload();
    }
  });

  // Character movement code
  const mapContainer = document.getElementById('map-container');
  const character = document.getElementById('character');

  // Add an event listener to capture mouse clicks on the map
  mapContainer.addEventListener('click', (event) => {
    // Calculate the position where the user clicked
    const rect = mapContainer.getBoundingClientRect();
    const x = event.clientX - rect.left - character.offsetWidth / 2;
    const y = event.clientY - rect.top - character.offsetHeight / 2;

    // Update the character's position
    character.style.left = `${x}px`;
    character.style.top = `${y}px`;

    // Send the new position to the server via Socket.io
    if (socket) {
      socket.emit('updatePosition', { x, y });
    }
  });

  // Handle message sending
  document.getElementById('send-message-button').addEventListener('click', function () {
    const messageInput = document.getElementById('message-input');
    let message = messageInput.value.trim();

    // Limit message to 40 characters
    if (message.length > 40) {
      message = message.substring(0, 40);
    }

    // Send the message to the server via Socket.io
    if (socket) {
      socket.emit('sendMessage', message);
    }

    // Display the speech bubble for the user's own character
    displaySpeechBubble(message);

    // Clear the message input
    messageInput.value = '';
  });

  // Function to display speech bubble for the user's own character
  function displaySpeechBubble(message) {
    const speechBubble = document.getElementById('speech-bubble');

    // Wrap text after 20 characters
    if (message.length > 20) {
      message = message.substring(0, 20) + '\n' + message.substring(20);
    }

    speechBubble.textContent = message;
    speechBubble.style.display = 'block';

    // Hide the speech bubble after 5 seconds
    setTimeout(() => {
      speechBubble.style.display = 'none';
    }, 5000);
  }

  // Function to set up Socket.io event listeners
  function setupSocketListeners() {
    // When receiving the list of all users
    socket.on('users', (usersList) => {
      // Remove own user from the list
      delete usersList[socket.id];

      // Add each user to the map
      for (const id in usersList) {
        addUserToMap(id, usersList[id]);
      }
    });

    // When a new user connects
    socket.on('newUser', ({ id, user }) => {
      addUserToMap(id, user);
    });

    // When a user updates their position
    socket.on('updatePosition', ({ id, position }) => {
      if (otherUsers[id]) {
        otherUsers[id].element.style.left = `${position.x}px`;
        otherUsers[id].element.style.top = `${position.y}px`;
      }
    });

    // When a user sends a new message
    socket.on('newMessage', ({ id, message }) => {
      if (otherUsers[id]) {
        displaySpeechBubbleForUser(otherUsers[id], message);
      }
    });

    // When a user disconnects
    socket.on('userDisconnected', (id) => {
      if (otherUsers[id]) {
        otherUsers[id].element.remove();
        delete otherUsers[id];
      }
    });
  }

  // Helper function to add a user to the map
  function addUserToMap(id, user) {
    const mapContainer = document.getElementById('map-container');

    // Create character element
    const userElement = document.createElement('div');
    userElement.classList.add('character');
    userElement.style.position = 'absolute';
    userElement.style.left = `${user.position.x}px`;
    userElement.style.top = `${user.position.y}px`;

    // Character image
    const characterImg = document.createElement('img');
    characterImg.src = `assets/${user.character_choice}.gif`;
    characterImg.style.width = '50px';
    characterImg.style.height = '50px';

    // Username label
    const usernameDiv = document.createElement('div');
    usernameDiv.textContent = user.username;
    usernameDiv.style.textAlign = 'center';

    // Speech bubble
    const speechBubble = document.createElement('div');
    speechBubble.classList.add('speech-bubble');
    speechBubble.style.display = 'none';

    // Append elements
    userElement.appendChild(characterImg);
    userElement.appendChild(speechBubble);
    userElement.appendChild(usernameDiv);
    mapContainer.appendChild(userElement);

    // Store reference to the user's element and speech bubble
    otherUsers[id] = {
      element: userElement,
      speechBubble: speechBubble,
    };
  }

  // Function to display speech bubble for other users
  function displaySpeechBubbleForUser(userObj, message) {
    const speechBubble = userObj.speechBubble;

    // Wrap text after 20 characters
    if (message.length > 20) {
      message = message.substring(0, 20) + '\n' + message.substring(20);
    }

    speechBubble.textContent = message;
    speechBubble.style.display = 'block';

    // Hide the speech bubble after 5 seconds
    setTimeout(() => {
      speechBubble.style.display = 'none';
    }, 5000);
  }
};
