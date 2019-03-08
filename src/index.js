const path = require('path') //core module no installation required
const http = require('http') //core module
const express = require('express')
const socketIO = require('socket.io')
const {generateMessage, generateLocationMessage} = require('./utils/messages') //get property from file
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

//Set up the express server
const app = express()
const server = http.createServer(app) //create server manually
const io = socketIO(server) //this also creates file to be served up accessible by clients

const port = process.env.PORT || 3000
//initialize directory path for web
const publicDirectoryPath = path.join(__dirname, '../public') //dirname current

app.use(express.static(publicDirectoryPath))

//establishes the connection and emits events
io.on('connection', (socket) => {
  console.log('New web socket connection')

  //listen for join
  socket.on('join', ({username, room}, callback) => {
    //stores as error or given user depending on validity
    const {error, user} = addUser({
      id: socket.id, //assign user id set by socket
      username,
      room
    })
    //sends error acknowledgement and stops execution if invalid
    if (error) {
      return callback(error)
    }

    socket.join(user.room) //join rooms when someone enters same room
    socket.emit('message', generateMessage('Admin', 'Welcome to N-Chat!')) //sends message to clients
    //broadcast message to all users upon user entering chat room
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined ${user.room} chatroom!`))
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })
  //listen for message from client
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id)
    //sends message to every connected client
    io.to(user.room).emit('message', generateMessage(user.username, message))
    callback()
  })

  //shre location with user displaying as google maps pinned location
  socket.on('shareLocation', (coords, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
    callback() //return call from server to acklowledge event completion
  })

  //broadcast on user leaving chat
  socket.on('disconnect', () => {
    const user = removeUser(socket.id)
    if (user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left the chatroom`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

server.listen(port, () => {
  console.log(`Server on port ${port} up and running.`);
}) //start the server
