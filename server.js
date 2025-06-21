const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());

// Hardcoded credentials (replace with database in production)
const validUsers = {
    "admin": "password123",
    "user1": "securepass456",
    "zeus": "thunderbolt"
};

// Authentication endpoint
app.post('/api/verify', (req, res) => {
    try {
        const { username, password, deviceId } = req.body;
        
        // Validate input
        if (!username || !password || !deviceId) {
            return res.status(400).json({ 
                success: false,
                message: "Missing required fields" 
            });
        }

        // Check credentials
        if (validUsers[username] && validUsers[username] === password) {
            // Successful login
            return res.json({ 
                success: true,
                message: "Login successful",
                user: username
            });
        } else {
            // Failed login
            return res.status(401).json({ 
                success: false,
                message: "Invalid credentials" 
            });
        }
    } catch (error) {
        console.error("Error in /api/verify:", error);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
