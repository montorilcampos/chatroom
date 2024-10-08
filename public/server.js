// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg'); // PostgreSQL client
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Initialize Express
const app = express();

// Create HTTP server and integrate Socket.io
const server = http.createServer(app);
const io = socketIo(server);

// Use express.json() to parse incoming JSON data
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Enable CORS if necessary
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

// PostgreSQL database connection pool
const db = new Pool({
  host: process.env.DB_HOST, // Database host
  user: process.env.DB_USER, // Database user
  password: process.env.DB_PASSWORD, // Database password
  database: process.env.DB_NAME, // Database name
  port: process.env.DB_PORT || 5432, // Database port (5432)
});

// Test the database connection
db.connect((err) => {
  if (err) {
    console.error('Error connecting to PostgreSQL Database:', err);
  } else {
    console.log('Connected to PostgreSQL Database');
  }
});

// Users connected via Socket.io
let users = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user initialization
  socket.on('init', (userData) => {
    // Retrieve user data from database
    const findUserQuery = 'SELECT position, message FROM users WHERE username = $1';
    db.query(findUserQuery, [userData.username], (err, result) => {
      if (err) {
        console.error('Error retrieving user data:', err);
      } else {
        const userRecord = result.rows[0];
        const position = userRecord && userRecord.position ? userRecord.position : { x: 100, y: 100 };
        const message = userRecord && userRecord.message ? userRecord.message : '';

        users[socket.id] = {
          username: userData.username,
          character_choice: userData.character_choice,
          position: position,
          message: message,
        };

        // Send the list of all users to the new user
        socket.emit('users', users);

        // Notify other users about the new user
        socket.broadcast.emit('newUser', { id: socket.id, user: users[socket.id] });
      }
    });
  });

  // Handle position updates
  socket.on('updatePosition', (position) => {
    if (users[socket.id]) {
      users[socket.id].position = position;

      // Broadcast the updated position to other users
      socket.broadcast.emit('updatePosition', { id: socket.id, position });

      // Update position in the database
      const username = users[socket.id].username;
      const updatePositionQuery = 'UPDATE users SET position = $1 WHERE username = $2';
      db.query(updatePositionQuery, [position, username], (err) => {
        if (err) {
          console.error('Error updating position in database:', err);
        }
      });
    }
  });

  // Handle message sending
  socket.on('sendMessage', (message) => {
    if (users[socket.id]) {
      users[socket.id].message = message;

      // Broadcast the message to other users
      socket.broadcast.emit('newMessage', { id: socket.id, message });

      // Update message in the database
      const username = users[socket.id].username;
      const updateMessageQuery = 'UPDATE users SET message = $1 WHERE username = $2';
      db.query(updateMessageQuery, [message, username], (err) => {
        if (err) {
          console.error('Error updating message in database:', err);
        }
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);

    // Remove the user from the users object
    delete users[socket.id];

    // Notify other users that this user has disconnected
    socket.broadcast.emit('userDisconnected', socket.id);
  });
});

// Handle user sign-up
app.post('/signup', async (req, res) => {
  const { username, password, character_choice } = req.body;

  try {
    // Check if the username already exists
    const checkUserQuery = 'SELECT * FROM users WHERE username = $1';
    db.query(checkUserQuery, [username], (err, result) => {
      if (err) {
        console.error('Error checking user:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (result.rows.length > 0) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      // Hash the password and store the new user in the database
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).json({ message: 'Server error' });
        }

        const insertUserQuery =
          'INSERT INTO users (username, password, character_choice) VALUES ($1, $2, $3)';
        db.query(insertUserQuery, [username, hashedPassword, character_choice], (err) => {
          if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ message: 'Database error' });
          }

          res.status(201).json({
            message: 'User created successfully!',
            user: {
              username,
              character_choice,
            },
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in /signup route:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Handle user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const findUserQuery = 'SELECT * FROM users WHERE username = $1';
    db.query(findUserQuery, [username], (err, result) => {
      if (err) {
        console.error('Error finding user:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'User not found' });
      }

      const user = result.rows[0];

      // Compare the provided password with the stored hashed password
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).json({ message: 'Server error' });
        }

        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid password' });
        }

        // Successful login
        res.status(200).json({
          message: 'Login successful!',
          user: {
            username: user.username,
            character_choice: user.character_choice,
          },
        });
      });
    });
  } catch (error) {
    console.error('Error in /login route:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Start the server on port 3000
server.listen(3000, () => {
  console.log('Server running on port 3000');
});
