const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const users = {};

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', (_username) => {
        if (!_username) {
            console.log('No username provided');
            return;
        }
        // user can't name themselves 'Group'
        let username = _username;
        if (username === 'Group') {
            _username = "User with name 'Group'"
        }
        for (let i = 1; Object.values(users).includes(username); i++) {
            username = `${_username} (${i})`;
        }
        console.log('New user:', username);
        io.emit('receiveMessage', { sender: 'System', message: `${username} 加入了群聊`, recipient: 'Group', msgType: 'system' });
        users[socket.id] = username;
        // notify the user of their assigned username
        socket.emit('username', username);
        io.emit('userList', Object.values(users));
    });

    socket.on('sendMessage', ({ sender, recipient, message, msgType }) => {
        if (recipient === 'Group') {
            io.emit('receiveMessage', { sender, message, recipient, msgType: msgType ?? 'text' });
        } else {
            const recipientSocketId = Object.keys(users).find(key => users[key] === recipient);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('receiveMessage', { sender, message, recipient, msgType: msgType ?? 'text' });
            }
        }
    });

    socket.on('disconnect', () => {
        io.emit('userList', Object.values(users));
        io.emit('receiveMessage', { sender: 'System', message: `${users[socket.id]} 退群了`, recipient: 'Group', msgType: 'system' });
        delete users[socket.id];
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 4000;
// serve ./web as static files
app.use(express.static('web'));
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));