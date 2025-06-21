const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB (you'll get this from MongoDB Atlas)
mongoose.connect('mongodb+srv://beastzeus51:VP2lHf7R2DEozH19@cluster0.2ef3faw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  devices: [{
    deviceId: String,
    lastAccess: { type: Date, default: Date.now }
  }]
});

const User = mongoose.model('User', userSchema);

// Authentication endpoint
app.post('/api/verify', async (req, res) => {
  const { username, password, deviceId } = req.body;
  
  try {
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
    
    // Check if device is already registered
    const existingDevice = user.devices.find(d => d.deviceId === deviceId);
    
    if (!existingDevice) {
      if (user.devices.length >= 1) { // Allow only 1 device
        return res.status(403).json({ 
          success: false, 
          message: 'Account already in use on another device' 
        });
      }
      user.devices.push({ deviceId });
      await user.save();
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));