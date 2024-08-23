
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/chat")
        .build();
    connection.start().catch(err => console.error(err.toString()));



document.getElementById("joinRoom").addEventListener("click", function () {
    const email = document.getElementById("email").value;
    const userName = document.getElementById("userName").value;

    if (userName && email) {
        connection.invoke("JoinedRoom", userName, email).catch(err => console.error(err.toString()));
        document.getElementById("homeScreen").style.display = "none";
        document.getElementById("chatScreen").style.display = "block";
    } else {
        alert("Please enter your username and email");
    }
});

connection.on("JoinedRoom", function (groups, gids) {
    const groupDiv = document.getElementById("groups-list");
    groupDiv.innerHTML = '';

    groups.forEach((roomName, index) => {
        const newItem = document.createElement('li');
        newItem.appendChild(document.createTextNode(roomName));

        const icon = document.createElement('i');
        icon.className = "fa-solid fa-ellipsis-vertical";
        icon.id = gids[index];
        newItem.appendChild(icon);
        groupDiv.appendChild(newItem);

        icon.addEventListener("click", function (e) {
            e.stopPropagation();

            const existingDiv = document.querySelector(`.delete-div-${gids[index]}`);
            if (existingDiv) {
                toggleAction(existingDiv);
            } else {
                const actions = document.createElement("div");
                actions.className = `delete-div-${gids[index]}`;
                actions.id = `${gids[index]}`;
                actions.innerText = "Delete";
                actions.style.backgroundColor = "red";
                actions.style.cursor = "pointer";
                actions.style.fontSize = "1rem";
                document.body.appendChild(actions);

                actions.addEventListener("click", function (d) {
                    deleteGroup(d.target.id);
                    actions.remove();
                    newItem.remove();
                });
            }
        });
    });
});















//$.connection.hub.logging = true;



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
connection.on("AddToGroupsDiv", function (groups, gids) {

    console.log("Groups:", groups);
    console.log("Group IDs:", gids);


    const groupDiv = document.getElementById("groups-list");
    groupDiv.innerHTML = '';

    groups.forEach((roomName, index) => {
        console.log(roomName);

        const newItem = document.createElement('li');
        newItem.className = "roomName";

        const groupImage = document.createElement('img');
        groupImage.src = "groupPhoto.jpg";
        groupImage.style.marginRight = '10px';

        newItem.appendChild(groupImage);
        newItem.appendChild(document.createTextNode(roomName));

        const icon = document.createElement('i');
        icon.className = "fa-solid fa-ellipsis-vertical";
        icon.id = gids[index];
        console.log(icon.id);
        icon.style.float = 'right';
        newItem.appendChild(icon);

        groupDiv.appendChild(newItem);
        icon.addEventListener("click", function (e) {
            e.stopPropagation();//invoking this method prevnts event from reaching any objects other than the current object

           
            const existingDiv = document.querySelector(`.delete-div-${gids[index]}`);
            if (existingDiv) {
                toggleAction(existingDiv);
            }
            else {

                const actions = document.createElement("div");
                actions.className = `delete-div-${gids[index]}`;
                actions.id = `${gids[index]}`;
                actions.innerText = "Delete";
                actions.style.backgroundColor = "red";
                actions.style.cursor = "pointer";
                actions.style.zIndex = "1000";
                actions.style.fontSize = "1rem";
                actions.style.padding="10px";
                actions.style.borderRadius="4px";
                actions.style.width = "7rem";
                actions.style.textAlign= "center";
                actions.style.color="white";

                const iconRect = e.target.getBoundingClientRect();
                actions.style.position = "absolute";
                actions.style.top = `${iconRect.bottom + window.scrollY}px`;
                actions.style.left = `${iconRect.left + window.scrollX}px`;

                document.body.appendChild(actions);

                actions.addEventListener("click", function (d) {
                    console.log(d.target.id);
                    deleteGroup(d.target.id);
                    actions.remove();
                    newItem.remove();
                });
            }
        });
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


document.addEventListener("DOMContentLoaded", function () {

    document.querySelector("#groups-list").addEventListener('click', function (e) {
        if (e.target && e.target.nodeName === "LI") {
            const selectedGroup = e.target.textContent.trim();
            document.getElementById("roomName").value = selectedGroup;
            document.getElementById("roomTitle").innerText = `Room: ${selectedGroup}`;

            document.getElementById("messages").innerHTML = '';

            loadMessages(selectedGroup);
        }
    });
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


function toggleAction(div) {
    if (div.style.display === "" || div.style.display === "none") {
        div.style.display = "block";
    } else {
        div.style.display = "none";
    }
    console.log("it is toggled");
}


function deleteGroup(roomId) {
    connection.invoke("DeleteGroup", roomId).catch(err => console.log(err.toString()));
}







$('#exampleModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget); // Button that triggered the modal
    var recipient = button.data('whatever'); // Extract info from data-* attributes
    var modal = $(this);
    modal.find('.modal-title').text('New message to ' + recipient);
    modal.find('.modal-body input').val(recipient);
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("submit-group").addEventListener("click", (e) => {
        const grpInput = document.querySelector("#group-name-input");
        const userName = document.getElementById("userName").value; // Get the userName input value
        console.log(userName);

        if (grpInput && userName) {
            console.log(grpInput.value);

            connection.invoke("JoinedRoom2", grpInput.value, userName)
                .catch(err => console.log(err.toString()));
            //connection.invoke("JoinedRoom2", grpInput, userName);
        }
        else {
            alert("Please enter a group name or check that you're signed in");
        }

        
    });
        
});
