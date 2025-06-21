// server.js
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const app = express();

// Database of users (in production, use a real database)
const users = {
    "admin": {
        password: "Tarekgf@155", // Store hashed passwords in production
        deviceBindings: {}
    },
    "Skc": {
        password: "Skc@1122#?3&%4%$",
        deviceBindings: {}
    }
};

// Middleware
app.use(bodyParser.json());

// Authentication endpoint
app.post('/api/auth', (req, res) => {
    const { username, password, device_id } = req.body;
    
    // Validate inputs
    if (!username || !password || !device_id) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    // Check user exists
    const user = users[username];
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }

    // Verify password (in production, use proper password hashing)
    if (password !== user.password) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }

    // Check if device is already registered
    const existingDevice = user.deviceBindings[device_id];
    if (existingDevice) {
        // Device already registered - return existing token
        return res.json({
            success: true,
            token: existingDevice.token
        });
    }

    // New device - generate token and register device
    const authToken = generateAuthToken();
    user.deviceBindings[device_id] = {
        token: authToken,
        createdAt: new Date()
    };

    res.json({
        success: true,
        token: authToken
    });
});

function generateAuthToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
