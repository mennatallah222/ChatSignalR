let connection;
let userName = '';
let email = '';

//function to start a new connection
function startConnection() {
    connection = new signalR.HubConnectionBuilder()
        .withUrl("/chat")
        .build();

    connection.start()
        .then(() => {
            if (userName && email) {
                invokeJoinedRoom();
            }
        })
        .catch(err => console.error('connection error:', err.toString()));
}

//function to stop the connection
function stopConnection() {
    if (connection) {
        //to ensure that stop() is returning a promise
        return connection.stop()
            .then(() => {
                return Promise.resolve();
            })
            .catch(err => {
                console.error('Error stopping connection:', err.toString());
                //return a rejected promise to propagate errors
                return Promise.reject(err);
            });
    } else {
        //return a resolved promise if there's no connection
        return Promise.resolve();
    }
}

//to invoke JoinedRoom
function invokeJoinedRoom() {
    if (userName && email) {
        connection.invoke("SignUp", userName, email)
            .catch(err => console.error('Invoke error:', err.toString()));
    }
}

//for the join room button
const joinRoomButton = document.getElementById("joinRoom");

if (joinRoomButton) {
    joinRoomButton.addEventListener("click", function () {
        const emailInput = document.getElementById("email").value;
        const userNameInput = document.getElementById("userName").value;

        setUser(userNameInput);
        setEmail(emailInput);

        console.log(`Username Input: ${userNameInput}, Email Input: ${emailInput}`);

        userName = userNameInput;
        email = emailInput;

        //to stop the current connection and redirect to the chats
        stopConnection().then(() => {
            window.location.href = "chatPage.html";
        }).catch(err => console.error('Redirect error:', err.toString()));
    });
}

//to set user information in session storage
function setUser(name) {
    sessionStorage.setItem('userName', name);
}

function setEmail(mail) {
    sessionStorage.setItem('email', mail);
}

//to get user information from session storage
function getUser() {
    return sessionStorage.getItem('userName');
}

function getEmail() {
    return sessionStorage.getItem('email');
}

//to check if we are on the chat page
if (window.location.pathname === '/chatPage.html') {
    userName = getUser();
    email = getEmail();
    
    startConnection();
}




connection.on("SignUp", function (groups, gids) {
    const groupDiv = document.getElementById("groups-list");
    groupDiv.innerHTML = '';
    console.log("we're in the joined room");

    groups.forEach((roomName, index) => {
        const newItem = document.createElement('li');
        const groupImage = document.createElement('img');
        groupImage.src = "/groupPhoto.jpg";
        groupImage.style.marginRight = '10px';

        newItem.className = 'roomName';
        console.log(newItem.className); 

        newItem.appendChild(groupImage);
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
                actions.style.zIndex = "1000";
                actions.style.fontSize = "1rem";
                actions.style.padding = "10px";
                actions.style.borderRadius = "4px";
                actions.style.width = "7rem";
                actions.style.textAlign = "center";
                actions.style.color = "white";

                const iconRect = e.target.getBoundingClientRect();
                actions.style.position = "absolute";
                actions.style.top = `${iconRect.bottom + window.scrollY}px`;
                actions.style.left = `${iconRect.left + window.scrollX}px`;

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






document.addEventListener("DOMContentLoaded", function () {

    //"keyup" occurs whenever a key is released after being pressed down within the input field
    document.getElementById("messageInput").addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            const message = document.getElementById("messageInput").value;
            const roomName = document.getElementById("roomTitle");
            console.log("Message: ", message);
            console.log(`room: ${roomName}`);
            if (message && roomName.textContent.replace("Room: ", "").trim()) {
                connection.invoke("SendMessageToRoom", roomName.textContent.replace("Room: ", "").trim(), message)
                   
                    .catch(err => console.error(err.toString()));
                loadMessages(roomName.textContent.replace("Room: ", "").trim());
                console.log(`roommmmmmmmmmmmm: ${roomName.textContent.replace("Room: ", "").trim() }`);
                document.getElementById("messageInput").value = '';

               
            }
        }
    });

    document.querySelector(".send-btn").addEventListener("click", () => {
        const message = document.getElementById("messageInput").value;
        const roomName = document.getElementById("roomTitle");

        if (message && roomName) {
            connection.invoke("SendMessageToRoom", roomName.textContent.replace("Room: ", "").trim(), message)
                .catch(err => console.error(err.toString()));

            loadMessages(roomName.textContent.replace("Room: ", "").trim());

            document.getElementById("messageInput").value = '';
        }
    });


});





connection.on("ReceiveMessage", function (msg) {
    const messages = document.getElementById("messages");
    const userName = getUser();

    const msgType = msg.sender === userName ? "users" : "others";
    messages.innerHTML += `
        <div class="groupMessage ${msgType}">
            <span class="userSpan">${msg.sender}</span>
            <p class="textContent"><br> ${msg.content}</p>
        </div>
        `;
    messages.scrollTop = messages.scrollHeight;
});



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

        const groupImage = document.createElement('img');
        groupImage.src = "/groupPhoto.jpg";
        groupImage.style.marginRight = '10px';

        newItem.appendChild(groupImage);
        newItem.appendChild(document.createTextNode(roomName));
        newItem.className = 'roomName';
        console.log(newItem.className); 

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

                    const chatTopBar = document.getElementById("chatTopBar");

                    if (chatTopBar) {
                        console.log('Clearing chatTopBar content');
                        while (chatTopBar.firstChild) {
                            chatTopBar.removeChild(chatTopBar.firstElementChild);
                        }
                    } else {
                        console.log('chatTopBar element not found!');
                    }

                    deleteGroup(d.target.id);
                    actions.remove();
                    newItem.remove();
                });

            }
        });
    });

});


function sanitizeGroupName(groupName) {
    return groupName.replace(/[^a-zA-Z0-9-_]/g, "");
}

document.addEventListener("DOMContentLoaded", function () {
    document.querySelector("#groups-list").addEventListener('click', function (e) {
        if (e.target && e.target.nodeName === "LI") {
            const selectedGroup = e.target.textContent.trim();
            const sanitizedGroupName = sanitizeGroupName(selectedGroup);

            console.log(selectedGroup);

            const roomNameElements = document.getElementsByClassName("roomName");
            if (roomNameElements.length > 0) {
                roomNameElements[0].value = selectedGroup;
            }

            const topBarTitle = document.getElementById("roomTitle");
            topBarTitle.innerText = `Room: ${selectedGroup}`;
            console.log("rooom is: ", selectedGroup);

            document.getElementById("messages").innerHTML = '';
            loadMessages(selectedGroup);
            console.log(" 2 . rooom is: ", selectedGroup);

            const existingMembersDiv = document.querySelector(`.membersDiv`);
            if (existingMembersDiv) {
                existingMembersDiv.remove();
            }

            const chatTopBar = document.getElementById("chatTopBar");

            if (!document.getElementById(`groupMembersBtn-${sanitizedGroupName}`)) {

                const divOfBtns = document.createElement('div');
                divOfBtns.id = "divOfBtns";
                divOfBtns.className = "button-container";
                chatTopBar.appendChild(divOfBtns);

                const groupMembersBtn = document.createElement('button');
                groupMembersBtn.id = "groupMembersBtn";
                groupMembersBtn.innerText = "Members";
                divOfBtns.appendChild(groupMembersBtn);

                const addMember = document.createElement('button');
                addMember.id = "addMemberBtn";
                addMember.innerText = "Add Member";
                addMember.setAttribute('data-toggle', 'modal');
                //setting data-target attribute
                addMember.setAttribute('data-target', '#addMember');
                divOfBtns.appendChild(addMember);

                //create group button
                groupMembersBtn.addEventListener("click", () => {
                    console.log(`selected grp: ${selectedGroup}`);

                    const existingDiv = document.querySelector(`#membersDiv-${sanitizedGroupName}`);
                    if (existingDiv) {
                        toggleAction(existingDiv);
                    }
                    else {
                        getMembers(selectedGroup);

                        const membersDiv = document.createElement('div');
                        membersDiv.id = `membersDiv-${sanitizedGroupName}`;
                        membersDiv.className = "membersDiv";

                        const bod = document.getElementsByClassName("cont")[0];
                        bod.appendChild(membersDiv);

                        console.log("i clicked on the members btn!!!");
                    }
                });   
            }
        }
    });
});

connection.on("DisplayMembers", function (membersNames, statuses, selectedGroup) {
    const membersDiv = document.getElementById(`membersDiv-${selectedGroup}`);
    if (membersDiv) {
        membersDiv.innerHTML = '';

       

        membersNames.forEach((m, index) => {
            const s = statuses[index+1];
            membersDiv.innerHTML += `
                <div class="memberInfo">
                    <div class="member">
                        <p>${m}</p>
                        <i class="${s === 'online' ? 'isOnline' : 'isOffline'}"></i>
                    </div>
                </div>
            `;
        });
    }
});


function getMembers(groupName) {
    connection.invoke("LoadMembers", groupName).catch(function (err) {
        return console.error(err.toString());
    });
}




function loadMessages(roomName) {
    console.log("loading messages from: ", roomName)
    connection.invoke("LoadMessages", roomName).catch(err => console.log(err.toString()));
}

connection.on("LoadGroupMessages", (msgs) => {
    displayMessages(msgs);
});

function displayMessages(messages) {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = '';

    messages.forEach(msg => {
        const msgType = msg.userName === getUser() ? "users" : "others";
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
    var button = $(event.relatedTarget);
    var recipient = button.data('whatever');
    var modal = $(this);
    modal.find('.modal-title').text('New message to ' + recipient);
    modal.find('.modal-body input').val(recipient);
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("submit-group").addEventListener("click", (e) => {
        const grpInput = document.querySelector("#group-name-input");
        const userName = getUser();
        console.log(userName);
        if (grpInput && userName) {
            console.log(grpInput.value);

            connection.invoke("JoinedRoom", grpInput.value, userName)
                .catch(err => console.log(err.toString()));
        }
        else {
            alert("Please enter a group name or check that you're signed in");
        }
    });
});



//add member to group
$('#addMember').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var recipient = button.data('whatever');
    var modal = $(this);
    modal.find('.modal-title').text('New message to ' + recipient);
    modal.find('.modal-body input').val(recipient);
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("submit-member").addEventListener("click", (e) => {
        console.log("clicked on the add member btn");
        const memberInput = document.querySelector("#member-email-input");
        const roomName = document.getElementById("roomTitle");
        console.log(roomName);
        const userName = getUser();
        if (memberInput && userName) {
            console.log("memberInput.value is: ");
            console.log(memberInput.value);

            connection.invoke("JoinedRoom", roomName.textContent.replace("Room: ", "").trim(), memberInput.value)
                .catch(err => console.log(err.toString()));
        }
        else {
            alert("Please enter a memberInput name or check that you're signed in");
        }
    });
});