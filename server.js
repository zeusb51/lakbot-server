const express = require('express');
const app = express();
app.use(express.json());

// Manually stored users (username: password)
const users = {
  "admin": "admin123",
  "user1": "password1",
};

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if username exists
  if (!users.hasOwnProperty(username)) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid username' 
    });
  }

  // Check if password matches
  if (users[username] !== password) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid password' 
    });
  }

  // Successful login
  res.json({ 
    success: true, 
    message: 'Login successful',
    user: username
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Stored users:', Object.keys(users));
});
