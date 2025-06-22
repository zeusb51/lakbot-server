const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

// Database (in-memory for example, use MongoDB/PostgreSQL in production)
const users = {
    "admin": {
        password: "admin123", // Store bcrypt hashes in production
        currentDevice: null,
        blockedDevices: new Set()
    },
   "amina": {
        password: "amina23", // Store bcrypt hashes in production
        currentDevice: null,
        blockedDevices: new Set()
    }
};

const activeDevices = new Map(); // device_id -> {username, lastActive}

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

    const user = users[username];
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }

    // Check if device is blocked
    if (user.blockedDevices.has(device_id)) {
        return res.status(403).json({
            success: false,
            message: "This device is blocked"
        });
    }

    if (password !== user.password) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    }

    // Check if already logged in on another device
    if (user.currentDevice && user.currentDevice !== device_id) {
        return res.json({
            success: false,
            message: "Already logged in on another device"
        });
    }

    // Generate token and register device
    const authToken = generateToken();
    user.currentDevice = device_id;
    activeDevices.set(device_id, {
        username: username,
        lastActive: new Date()
    });

    res.json({
        success: true,
        token: authToken,
        is_new_device: true
    });
});

// Admin endpoints
app.post('/api/admin/block-device', (req, res) => {
    const { adminToken, device_id } = req.body;
    
    // Verify admin (in production, use JWT verification)
    if (!adminToken || adminToken !== "SECRET_ADMIN_TOKEN") {
        return res.status(403).json({ success: false });
    }

    // Block device for all users
    Object.values(users).forEach(user => {
        user.blockedDevices.add(device_id);
        if (user.currentDevice === device_id) {
            user.currentDevice = null;
        }
    });
    
    activeDevices.delete(device_id);
    res.json({ success: true });
});

app.get('/api/admin/active-devices', (req, res) => {
    if (req.query.adminToken !== "SECRET_ADMIN_TOKEN") {
        return res.status(403).json({ success: false });
    }

    res.json({
        success: true,
        devices: Array.from(activeDevices.entries()).map(([id, data]) => ({
            device_id: id,
            username: data.username,
            last_active: data.lastActive
        }))
    });
});

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

app.listen(3000, () => console.log('Server running on port 3000'));
