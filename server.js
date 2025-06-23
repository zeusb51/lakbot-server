const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

const ADMIN_SECRET = "203114";
const activeDevices = new Map(); // device_id -> {username, ip, loginTime, deviceInfo}

// User database
const users = {
    "admin": {
        password: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // SHA-256 of "admin123"
        currentDevice: null
    }
};

// Authentication endpoint
app.post('/api/auth', (req, res) => {
    const { username, password, device_id, device_info } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    if (!username || !password || !device_id) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const user = users[username];
    if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check if device is blocked
    if (user.blockedDevices && user.blockedDevices.has(device_id)) {
        return res.status(403).json({ success: false, message: "Device blocked" });
    }

    if (password !== user.password) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate token and register device
    const authToken = generateToken();
    user.currentDevice = device_id;
    
    // Track active device
    activeDevices.set(device_id, {
        username: username,
        ip: clientIp,
        loginTime: new Date().toISOString(),
        deviceId: device_id,
        deviceInfo: device_info || "Unknown device"
    });

    res.json({
        success: true,
        token: authToken,
        is_new_device: true
    });
});

// Admin endpoints
app.get('/api/admin/active-devices', (req, res) => {
    if (req.query.adminToken !== ADMIN_SECRET) {
        return res.status(403).json({ success: false });
    }

    res.json({
        success: true,
        devices: Array.from(activeDevices.values())
    });
});

app.post('/api/admin/block-device', (req, res) => {
    const { adminToken, device_id } = req.body;
    
    if (adminToken !== ADMIN_SECRET) {
        return res.status(403).json({ success: false });
    }

    // Block device for all users
    Object.values(users).forEach(user => {
        if (!user.blockedDevices) user.blockedDevices = new Set();
        user.blockedDevices.add(device_id);
        if (user.currentDevice === device_id) {
            user.currentDevice = null;
        }
    });
    
    activeDevices.delete(device_id);
    res.json({ success: true });
});

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

app.listen(3000, () => console.log('Server running on port 3000'));
