const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

const ADMIN_SECRET = "203114";
const activeDevices = new Map(); // device_id -> {username, ip, loginTime, deviceInfo}
const blockedDevices = new Set();

// User database with multiple admin users
const users = {
    // Regular users
    "skc": {
        password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // SHA-256 of "password"
        isAdmin: false,
        blockedDevices: new Set()
    },
    "shnz": {
        password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // SHA-256 of "password"
        isAdmin: false,
        blockedDevices: new Set()
    },
    "Firoz": {
        password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // SHA-256 of "password"
        isAdmin: false,
        blockedDevices: new Set()
    },
   "Ithu": {
        password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // SHA-256 of "password"
        isAdmin: false,
        blockedDevices: new Set()
    },
    
    // Admin users
    "admin1": {
        password: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // SHA-256 of "admin"
        isAdmin: true,
        blockedDevices: new Set()
    },
    "admin2": {
        password: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5", // SHA-256 of "12345"
        isAdmin: true,
        blockedDevices: new Set()
    },
    "superadmin": {
        password: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", // SHA-256 of "1234"
        isAdmin: true,
        blockedDevices: new Set()
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

    // Check if device is blocked globally or by user
    if (blockedDevices.has(device_id) || user.blockedDevices.has(device_id)) {
        return res.status(403).json({ 
            success: false, 
            message: "This device has been blocked by administrator",
            isBlocked: true
        });
    }

    // Verify password (compare SHA-256 hashes)
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (hashedPassword !== user.password) {
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
        deviceInfo: device_info || "Unknown device",
        isAdmin: user.isAdmin
    });

    res.json({
        success: true,
        token: authToken,
        isAdmin: user.isAdmin,
        is_new_device: true
    });
});

// Admin endpoints
app.post('/api/admin/active-devices', (req, res) => {
    if (req.body.adminToken !== ADMIN_SECRET) {
        return res.status(403).json({ success: false });
    }

    const devices = Array.from(activeDevices.values()).map(device => ({
        ...device,
        isBlocked: blockedDevices.has(device.deviceId)
    }));

    res.json({
        success: true,
        devices: devices
    });
});

app.post('/api/admin/block-device', (req, res) => {
    const { adminToken, device_id } = req.body;
    
    if (adminToken !== ADMIN_SECRET) {
        return res.status(403).json({ success: false });
    }

    // Block device globally
    blockedDevices.add(device_id);
    
    // Also remove from active devices
    activeDevices.delete(device_id);
    
    res.json({ success: true });
});

app.post('/api/admin/unblock-device', (req, res) => {
    const { adminToken, device_id } = req.body;
    
    if (adminToken !== ADMIN_SECRET) {
        return res.status(403).json({ success: false });
    }

    // Unblock device globally
    blockedDevices.delete(device_id);
    res.json({ success: true });
});

// Admin user management
app.post('/api/admin/users', (req, res) => {
    const { adminToken } = req.body;
    
    if (adminToken !== ADMIN_SECRET) {
        return res.status(403).json({ success: false });
    }

    const userList = Object.keys(users).map(username => ({
        username,
        isAdmin: users[username].isAdmin,
        isActive: users[username].currentDevice !== null
    }));

    res.json({
        success: true,
        users: userList
    });
});

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

app.listen(3000, () => console.log('Server running on port 3000'));
