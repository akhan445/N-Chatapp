const socket = io()

// variables for easy access to areas of recurring code
const msgForm = document.querySelector('#message_form')
const msgFormInput = msgForm.querySelector('input')
const msgFormButton = msgForm.querySelector('button')
const shareLocationButton = document.querySelector('#share_location')
const messages = document.querySelector('#messages')
const msgTemplate = document.querySelector('#msg_template').innerHTML
const locTemplate = document.querySelector('#location_template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar_template').innerHTML
//Options using qs library to parse strings
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

//autoscroll to keep recent message visible first
const autoscroll = () => {
  const newMsg = messages.lastElementChild //element of message

  const newMsgStyles = getComputedStyle(newMsg)
  const newMsgMargin = parseInt(newMsgStyles.marginBottom) //get the marginal value
  const newMsgHeight = newMsg.offsetHeight + newMsgMargin //height of new message

  const visibleHeight = messages.offsetHeight
  const containerHeight = messages.scrollHeight
  const scrollOffset = messages.scrollTop + visibleHeight //get height difference based on scroll bar height

  if (containerHeight - newMsgHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight
  }
}

//listen for message from server
socket.on('message', (message) => {
  console.log(message)
  const html = Mustache.render(msgTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('lll')
  })
  messages.insertAdjacentHTML('beforeend', html) //add to div class in html doc
  autoscroll()
})

//listen for the message asking for location sharing
socket.on('locationMessage', (message) => {
  console.log(message)
  const html = Mustache.render(locTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('lll')
  })
  messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('roomData', ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})
//target the form created, listening for submit event
msgForm.addEventListener('submit', (e) => {

  //avoid the app from refreshing
  e.preventDefault()

  //disabling button when button clicked/while message being sent
  msgFormButton.setAttribute('disabled', 'disabled')
  //take message and store it by selecting it by its name
  const message = e.target.elements.message.value

  //send message
  //anonymous function allows for server to send acknowledgement of message receival
  socket.emit('sendMessage', message, (message) => {
    msgFormButton.removeAttribute('disabled') //re-enable submit button after sending message
    msgFormInput.value = '' //clear message field
    msgFormInput.focus() //move cursor back to input field
    console.log('Message delivered', message);
  })
})

//share Location
shareLocationButton.addEventListener('click', () => {
  // send error message if browser not supported
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser')
  }
  //disable button when button clicked and waiting to share
  shareLocationButton.setAttribute('disabled', 'disabled')
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('shareLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, () => { //confirmation once location shared successfully
      shareLocationButton.removeAttribute('disabled') //re-enable location button

      console.log('Shared Location');
    })
  })
})

socket.emit('join', {username, room}, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})
