const app = require('express')(),
      path = require('path'),
      http = require('http').Server(app),
      io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', socket => {
    console.log('new connection');

    socket.on('chat message', msg => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('user disconected');
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});
