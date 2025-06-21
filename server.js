const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Mock user database
const users = {
    "admin": {
        password: "password123",
        deviceId: null
    }
};

app.post('/api/verify', (req, res) => {
    try {
        const { username, password, deviceId } = req.body;
        
        if (!username || !password || !deviceId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const user = users[username];
        
        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        if (!user.deviceId) {
            // First login
            user.deviceId = deviceId;
            return res.json({
                success: true,
                message: "Login successful"
            });
        } else if (user.deviceId === deviceId) {
            // Recognized device
            return res.json({
                success: true,
                message: "Login successful"
            });
        } else {
            // Device mismatch
            return res.status(403).json({
                success: false,
                message: "Account in use on another device",
                errorCode: "DEVICE_MISMATCH"
            });
        }
    } catch (error) {
        console.error("Error in /api/verify:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
