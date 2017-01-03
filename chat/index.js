'use strict';

const app = require('express')(),
      path = require('path'),
      http = require('http').Server(app),
      io = require('socket.io')(http),
      uuid = require('node-uuid');

let people = {},
    rooms = {},
    clients = [];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.css'));
});

function getTime () {
    const now = new Date(),
          hours = ('00' + now.getHours()).substr(-2,2),
          minutes = ('00' + now.getMinutes()).substr(-2,2);

    return `[${hours}:${minutes}]`;
}

io.on('connection', socket => {
    socket.on('login', name => {
        const userList = [];

        people[socket.id] = {
            "name" : name,
            "room" : [0]
        };

        socket.join(0);
        socket.emit('login', 0);

        socket.broadcast.to(people[socket.id].room).emit('chat message', {
            author: 'System',
            timestamp: getTime(),
            text: `${people[socket.id].name} has joined.`
        });

        io.in(people[socket.id].room).emit('user join', {
            name: people[socket.id].name
        });

        for (let user in people) {
            if (people[user] && typeof people[user].name !== 'undefined') {
                userList.push({
                    name: people[user].name
                });
            }

            continue;
        }

        socket.emit('user list', userList);

        clients.push(socket);
    });

    socket.on('get userinfo', () => {
        socket.emit('userinfo', people[socket.id]);
    });

    socket.on('typing message', (user) => {
        if(people[socket.id]) {
            socket.broadcast.to(people[socket.id].room).emit('typing message', {
                name: people[socket.id].name,
                isTyping: user.isTyping
            });
        }
    });

    socket.on('join room', (roomID) => {
        socket.join(roomID);
        socket.emit('login', roomID);

        socket.broadcast.to(roomID).emit('chat message', {
            author: 'System',
            timestamp: getTime(),
            text: `${people[socket.id].name} has joined.`
        });

        io.in(roomID).emit('user join', {
            name: people[socket.id].name
        });
    });

    socket.on('leave room', (roomID) => {
        socket.leave(roomID);
    });

    socket.on('chat message', msg => {
        msg ? socket.broadcast.to(people[socket.id].room).emit('chat message', {
            author: people[socket.id].name,
            timestamp: getTime(),
            text: msg
        }) : '';
    });

    socket.on('disconnect', () => {
        if (people[socket.id]) {
            socket.broadcast.to(people[socket.id].room).emit('user leave', people[socket.id].name);
            io.emit('chat message', {
                author: 'System',
                timestamp: getTime(),
                text: `${people[socket.id].name} has left.`
            });
            people[socket.id] = null;
        }
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});
