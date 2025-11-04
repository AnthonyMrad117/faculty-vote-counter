const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Admin password (hardcoded)
const ADMIN_PASSWORD = 'Faculty2025!';

// Set to store admin socket IDs (allows multiple admins)
const adminSockets = new Set();

// Vote data structure
const voteData = {
  'F.ENG': {
    name: 'F.ENG',
    total: 123,
    elector1: 'Christian Jarouj',
    elector2: 'Kamil Hedwen',
    votes: { elector1: 0, elector2: 0, blank: 0 }
  },
  'F.BAE': {
    name: 'F.BAE',
    total: 108,
    elector1: 'Elisha Jarouj',
    elector2: 'Roy Frangieh',
    votes: { elector1: 0, elector2: 0, blank: 0 }
  },
  'F.NAS': {
    name: 'F.NAS',
    total: 100,
    elector1: 'Mathieu Takla',
    elector2: 'Hisham El Daas',
    votes: { elector1: 0, elector2: 0, blank: 0 }
  },
  'F.AAD': {
    name: 'F.AAD',
    total: 50,
    elector1: 'Joya Tahech',
    elector2: 'Charbel Yammine',
    votes: { elector1: 0, elector2: 0, blank: 0 }
  },
  'F.HUM': {
    name: 'F.HUM',
    total: 84,
    elector1: 'Jean Paul Matta',
    elector2: 'Emilio Bou Tannous',
    votes: { elector1: 0, elector2: 0, blank: 0 }
  },
  'F.NHS': {
    name: 'F.NHS',
    total: 27,
    elector1: 'Rossa Maria Fares',
    elector2: 'Youssef Aoun',
    votes: { elector1: 0, elector2: 0, blank: 0 }
  }
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send current vote data to new client
  socket.emit('voteUpdate', voteData);
  
  // Handle admin login request with password
  socket.on('requestAdmin', (password) => {
    if (password === ADMIN_PASSWORD) {
      // Password correct, grant admin access
      adminSockets.add(socket.id);
      socket.emit('adminGranted');
      console.log('Admin granted to:', socket.id);
    } else {
      // Password incorrect, deny access
      socket.emit('adminDenied', 'Incorrect password');
      console.log('Admin denied to:', socket.id, '- Incorrect password');
    }
  });

  // Handle vote data request
  socket.on('requestVoteData', () => {
    socket.emit('voteUpdate', voteData);
  });

  // Handle vote submission from admin
  socket.on('submitVote', (data) => {
    const { faculty, voteType } = data;
    
    // Check if this socket is an admin
    if (adminSockets.has(socket.id) && voteData[faculty]) {
      if (voteType === 'elector1') {
        voteData[faculty].votes.elector1++;
      } else if (voteType === 'elector2') {
        voteData[faculty].votes.elector2++;
      } else if (voteType === 'blank') {
        voteData[faculty].votes.blank++;
      }
      
      // Broadcast update to all clients
      io.emit('voteUpdate', voteData);
      console.log(`Vote registered: ${faculty} - ${voteType}`);
    }
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove from admin set if it was an admin
    if (adminSockets.has(socket.id)) {
      adminSockets.delete(socket.id);
      console.log('Admin disconnected:', socket.id);
    }
  });
});

// Route for results page
app.get('/results', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// Route for admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Route for viewer page
app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});


const PORT = process.env.PORT;
console.log("Starting server...");
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




