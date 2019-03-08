const users = []

const addUser = ({id, username, room}) => {
  username = username.trim().toLowerCase()
  room = room.trim().toLowerCase()
  //error message if no username or room entered
  if (!username || !room) {
    return {
      error: 'Username and room are required'
    }
  }

  //finds user in room with a given name
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username
  })
  //makes sure there isn't 2 users with same name in one room
  if (existingUser) {
    return {
      error: 'Username already exists'
    }
  }
  //Store user in array
  const user = {id, username, room}
  users.push(user)
  return {user}
}

//remove user
const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id)
  //found match, remove user
  if (index !== -1) {
    return users.splice(index, 1)[0] //remove by index
  }
}

//gets a user by their id
const getUser = (id) => {
  return users.find((user) => user.id === id)
}

//gets users in a given room
const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room)
}

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
}
