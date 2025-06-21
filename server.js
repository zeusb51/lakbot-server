const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Database mock (replace with real DB in production)
const users = {
    "admin": {
        password: "password123",
        deviceId: null // Stores the first device ID that logs in
    }
};

app.use(bodyParser.json());

app.post('/api/verify', (req, res) => {
    const { username, password, deviceId } = req.body;
    
    if (!users[username]) {
        return res.status(401).json({ 
            success: false,
            message: "Invalid credentials"
        });
    }

    const user = users[username];
    
    // Check password
    if (user.password !== password) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }

    // Device verification logic
    if (!user.deviceId) {
        // First login - register device
        user.deviceId = deviceId;
        return res.json({
            success: true,
            message: "Login successful",
            isNewDevice: true
        });
    } else if (user.deviceId === deviceId) {
        // Recognized device
        return res.json({
            success: true,
            message: "Login successful",
            isNewDevice: false
        });
    } else {
        // Unknown device - reject login
        return res.status(403).json({
            success: false,
            message: "Account is already in use on another device",
            errorCode: "DEVICE_MISMATCH"
        });
    }
});

// Add device reset endpoint for legitimate device changes
app.post('/api/reset-device', (req, res) => {
    const { username, password, newDeviceId } = req.body;
    
    if (!users[username] || users[username].password !== password) {
        return res.status(401).json({ success: false });
    }

    users[username].deviceId = newDeviceId;
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000);
