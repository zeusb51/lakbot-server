const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

// User database (use real DB in production)
const users = {
    "admin": {
        password: "admin123", // Store bcrypt hashes in production
        currentDevice: null
    },
    "amina": {
        password: "amina@123",
        currentDevice: null
    },
    "@skc": {
        password: "@skc@123#",
        currentDevice: null
    }
};

// Authentication endpoint
app.post('/api/auth', (req, res) => {
    const { username, password, device_id } = req.body;
    
    // 1. Validate inputs
    if (!username || !password || !device_id) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    // 2. Check user exists
    const user = users[username];
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }

    // 3. Verify password (use bcrypt.compare in production)
    if (password !== user.password) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }

    // 4. Check if already logged in on another device
    if (user.currentDevice && user.currentDevice !== device_id) {
        return res.json({
            success: false,
            message: "Account is already active on another device"
        });
    }

    // 5. Generate new token and register device
    const authToken = generateToken();
    user.currentDevice = device_id;

    res.json({
        success: true,
        token: authToken,
        is_new_device: true
    });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    const { username } = req.body;
    
    if (users[username]) {
        users[username].currentDevice = null;
    }
    
    res.json({ success: true });
});

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

app.listen(3000, () => console.log('Server running on port 3000'));
