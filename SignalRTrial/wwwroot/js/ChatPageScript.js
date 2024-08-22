
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/chat")
        .build();
    connection.start().catch(err => console.error(err.toString()));
    document.getElementById("joinRoom").addEventListener("click", function () {
        const roomName = document.getElementById("roomName").value;
        const userName = document.getElementById("userName").value;

        if (userName && roomName) {
            connection.invoke("JoinedRoom", roomName, userName).catch(err => console.error(err.toString()));
            document.getElementById("homeScreen").style.display = "none";
            document.getElementById("chatScreen").style.display = "block";
            document.getElementById("roomTitle").innerText = `Room: ${roomName}`;

        }
        else alert("please enter your username and the groupname");

    });






//"keyup" occurs whenever a key is released after being pressed down within the input field
document.getElementById("messageInput").addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        const message = document.getElementById("messageInput").value;
        const roomName = document.getElementById("roomName").value;

        if (message && roomName) {
            connection.invoke("SendMessageToRoom", roomName, message)
                .catch(err => console.error(err.toString()));

            document.getElementById("messageInput").value = '';
        }
    }
});



document.querySelector(".send-btn").addEventListener("click", () => {
    const message = document.getElementById("messageInput").value;
    const roomName = document.getElementById("roomName").value;

    if (message && roomName) {
        connection.invoke("SendMessageToRoom", roomName, message)
            .catch(err => console.error(err.toString()));

        document.getElementById("messageInput").value = '';
    }
});



connection.on("ReceiveMessage", function (msg) {
    const messages = document.getElementById("messages");
    const userName = document.getElementById("userName").value;
    const msgType = msg.sender === userName ? "users" : "others";
    messages.innerHTML += `
        <div class="groupMessage ${msgType}">
            <span class="userSpan">${msg.sender}</span>
            <p class="textContent"><br> ${msg.content}</p>
        </div>
        `;
    messages.scrollTop = messages.scrollHeight;
});


//connection.on("ReceiveMessage", (message) => {
//    console.log("Message received: " + message);
//});

connection.on("ReceiveNotification", (notificationMessage) => {
    document.getElementById("alertModalBody").innerHTML = `

        <div class="alert alert-success alert-dismissible fade show" role="alert">
          <p>${notificationMessage}</p>
        </div>
    `;
    $('#alertModal').modal('show');
    console.log("Notification: " + notificationMessage);
});


connection.on("UserJoined", function (msg) {
    const messages = document.getElementById("messages");
    messages.innerHTML += `<p class="joinedAndLeftMsg">${msg} has joined the chat</p>`;
});

connection.on("UserLeft", function (msg) {
    const messages = document.getElementById("messages");
    messages.innerHTML += `<p class="joinedAndLeftMsg">${msg} has left the chat</p>`;
});
connection.on("AddToGroupsDiv", function (groups) {
    const groupDiv = document.getElementById("groups-list");
    groupDiv.innerHTML = '';

    groups.forEach(roomName => {
        const newItem = document.createElement('li');
        const groupImage = document.createElement('img');
        groupImage.src = "groupPhoto.jpg";
        groupImage.style.marginRight = '10px';

        newItem.appendChild(groupImage);
        newItem.appendChild(document.createTextNode(roomName));

        groupDiv.appendChild(newItem);
    });

});


document.addEventListener('DOMContentLoaded', function () {
    document.querySelector(".userGroups").addEventListener('click', toggleGroups);
});

function toggleGroups() {
    const groupsDiv = document.querySelector(".groups-div");
    if (groupsDiv.style.display === "" || groupsDiv.style.display === "none") {
        groupsDiv.style.display = "block";
    } else {
        groupsDiv.style.display = "none";
    }
    console.log("it is displayed");
}



document.querySelector("#groups-list").addEventListener('click', function (e) {
    if (e.target && e.target.nodeName === "LI") {
        const selectedGroup = e.target.textContent.trim();
        document.getElementById("roomName").value = selectedGroup;
        document.getElementById("roomTitle").innerText = `Room: ${selectedGroup}`;

        // Clear current messages before loading new ones
        document.getElementById("messages").innerHTML = '';

        // Fetch messages for the selected group
        loadMessages(selectedGroup);
    }
});



function loadMessages(roomName) {
    connection.invoke("LoadMessages", roomName).catch(err => console.log(err.toString()));
}

connection.on("LoadGroupMessages", (msgs) => {
    displayMessages(msgs);
});

function displayMessages(messages) {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = ''; // Clear previous messages

    messages.forEach(msg => {
        const msgType = msg.userName === document.getElementById("userName").value ? "users" : "others";
        messagesDiv.innerHTML += `
            <div class="groupMessage ${msgType}">
                <span class="userSpan">${msg.userName}</span>
                <p class="textContent"><br>${msg.content}</p>
            </div>
        `;
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
