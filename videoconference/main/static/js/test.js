
// Создание WebSocket-соединения.
const socket = new WebSocket('ws://' + window.location.host + '/ws/main/lobby/');

// Соединение открыто
socket.addEventListener("open", (event) => {
    socket.send("Hello Server!");
});

// Получение сообщений
socket.addEventListener("message", (event) => {
    console.log("Message from server ", event.data);
});