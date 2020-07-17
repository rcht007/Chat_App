const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    // The Window.getComputedStyle() method returns an 
    // object containing the values of all 
    // CSS properties of an element, 
      //   Individual CSS property values are accessed through 
    // APIs provided by the object, 
    // or by indexing with CSS property names.
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    //$newMessage.offsetHeight if would have taken into account the 
    //margin then there would have been no need for three lines
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    //addmargin to the offsetHeight of the last message + the margin by css


    // Visible height the offset height of messages element
    const visibleHeight = $messages.offsetHeight

    // Height of messages container container height more than the visible
    // height gives us total height we can scroll throough
    // The scrollHeight value is equal to the minimum height
    //  the element would require in order to fit all the content 
    // in the viewport without using a vertical scrollbar
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    // The Element.scrollTop property gets or sets the number 
    // of pixels that an element's content is scrolled vertically.
    const scrollOffset = $messages.scrollTop + visibleHeight

    // if at the bottom before the last message was added
    if (containerHeight - newMessageHeight <= scrollOffset) {
    //    pushes us to the bottom
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        //timestamp ki form m h to format ayr moment convert kr dega
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})
///on submit of form 
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
//disables a button to prevent multiple request sends
    $messageFormButton.setAttribute('disabled', 'disabled')

    // target.elements availible on the event basicaly we get message form elements
    //and can exess them directly using dot operator. value gives its value
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        //callback when the meessage is sent aand we get result fromserver then executed
        $messageFormButton.removeAttribute('disabled')
        //remove disabled once the message send
        $messageFormInput.value = ''
        //JQUERY FUNCTION TO PUT FOCUS ON THE ELEMENT WHEN WE HOVER OVER IT
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')
//get s back coords in a object 
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            //callback after sending locaition to server
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')  
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/login'
    }
})