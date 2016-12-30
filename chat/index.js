'use strict';

const app = require('express')(),
      path = require('path'),
      http = require('http').Server(app),
      io = require('socket.io')(http),
      uuid = require('node-uuid'),
      Room = require('./room.js');

let people = {},
    rooms = {},
    clients = [];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.css'));
});

io.on('connection', socket => {
    socket.on('login', name => {
        const userList = [];

        people[socket.id] = {
            "name" : name,
            "room" : 'ALL'
        };

        socket.join('ALL');
        socket.emit('login', 'ALL');

        socket.broadcast.to(people[socket.id].room).emit('chat message', `${people[socket.id].name} has joined.`);
        io.in(people[socket.id].room).emit('user join', people[socket.id].name);

        for (let user in people) {
            if (people[user] && typeof people[user].name !== 'undefined') {
                userList.push(people[user].name);
            }

            continue;
        }

        socket.emit('user list', userList);

        clients.push(socket);
    });

    socket.on('typingMessage', (user) => {
        if(people[socket.id]) {
            socket.broadcast.to(people[socket.id].room).emit('typingMessage', {
                name: people[socket.id].name,
                isTyping: user.isTyping
            });
        }
    });

    socket.on('createRoom', name => {
        if (people[client.id].room === null) {
            var id = uuid.v4();
            var room = new Room(name, id, client.id);
            rooms[id] = room;
            io.sockets.emit("roomList", {rooms: rooms}); //update the list of rooms on the frontend
            client.room = name; //name the room
            client.join(client.room); //auto-join the creator to the room
            room.addPerson(client.id); //also add the person to the room object
            people[client.id].room = id;
        } else {
            socket.sockets.emit("update", "You have already created a room.");
        }
    });

    socket.on('chat message', msg => {
        const now = new Date(),
              hours = ('00' + now.getHours()).substr(-2,2),
              minutes = ('00' + now.getMinutes()).substr(-2,2);

        msg ? socket.broadcast.to(people[socket.id].room).emit('chat message', `[${hours}:${minutes}] ${people[socket.id].name}: ${msg}`) : '';
    });

    socket.on('disconnect', () => {
        if (people[socket.id]) {
            socket.broadcast.to(people[socket.id].room).emit('user leave', people[socket.id].name);
            io.emit('chat message', `${people[socket.id].name} has left.`);
            people[socket.id] = null;
        }
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});
