require('colors');

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const requestIp = require('request-ip');
const redis = require('redis');
const client = redis.createClient();

function consoleLog(event, method, msg = undefined) {
    console.log(event.red + '.' + method.yellow + (msg !== undefined ? ('=>' + msg) : ''));
}


app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    // Add rooms to redis
    // client.sadd("rooms", "informatique");
    // client.sadd("rooms", "marketing");

    socket.on('chat.loadRooms', function (data) {
        client.smembers('rooms', (err, rooms) => {
           rooms.forEach((room) => {
               socket.emit('chat.loadRooms', room);
           });
        });
    });

    socket.on('chat.join', function (data) {
       const json = JSON.parse(data);
       // consoleLog('chat', 'join', data);
       // Save username
        socket.username = json.username;
        socket.room = json.room;
        socket.userIp = requestIp.getClientIp(socket.request);

        // join room
        socket.join(socket.room);

        client.lrem('users', 0, JSON.stringify({'username': socket.username, 'ip' : socket.userIp}), function (err, res) {
        });
        client.rpush('users', JSON.stringify({'username': socket.username, 'ip' : socket.userIp}), (err, res) => function (err, res) {});


        // broadcast username
        socket.broadcast.to(socket.room).emit('chat.join', socket.username);

       // emit username
       //  socket.to(socket.room).emit('chat.join', socket.username);

        // Retrieve 20 messages of the LIST "messages"
        client.lrange('messages', 0, 20, (err, jsonMessages) => {
            jsonMessages.reverse().forEach((jsonMessage) => {
                if(jsonMessage.includes(`"room":"${socket.room}"`))
                {
                    socket.emit('chat.message', jsonMessage);
                }
            });
        });
    });

    socket.on('chat.leave', () => {
        socket.leave(socket.room);
        socket.broadcast.to(socket.room).emit('chat.leave', socket.username);
    });

    socket.on('chat.message', (message) => {
        consoleLog('chat', 'message', ('[' + socket.username + ']').bold + ' ' + message);

        const json = JSON.stringify({username: socket.username, message, room : socket.room});

        client.lpush('messages', json, (err, reply) => {
            console.log('redis lpush => ' + reply);
        });

        // Emit event "chat.message" to connected users (without the current one)
        socket.broadcast.emit('chat.message', json);

        // Emit event "chat.message" to current user only
        socket.emit('chat.message', json);
    });

    socket.on('disconnect', () => {
        consoleLog('socket', 'disconnect', ('[' + socket.username + ']').bold + ' socket closed');
        if (socket.username !== undefined) {
            // Emit event "chat.disconnect" to connected users (without the current one)
            socket.broadcast.to(socket.room).emit('chat.disconnect', socket.username);
            // Remove current user to the SET "users"
            // client.srem('users', socket.username);
        }
    });
});

http.listen(3000, () => console.log('Listening on ' + 'http://localhost:3000\n'.green));