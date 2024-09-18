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
            window.location.href = "chat.html";
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


if (window.location.pathname === '/chat.html') {
    userName = getUser();
    email = getEmail();

    startConnection();
}



if (connection) {

    connection.on("SignUp", function (groups, gids) {
        const groupDiv = document.getElementById("groups-list");
        groupDiv.innerHTML = '';
        console.log("we're in the joined room");

        groups.forEach((roomName, index) => {
            const newItem = document.createElement('li');
            newItem.setAttribute('data-group', gids[index]);


            const groupImage = document.createElement('img');
            groupImage.src = "/groupPhoto.jpg";
            groupImage.style.marginRight = '10px';

            newItem.className = 'roomName';
            console.log(newItem.className);

            newItem.appendChild(groupImage);
            const groupName = document.createElement('p');
            groupName.id = `${roomName}`;
            groupName.innerText = roomName;

            newItem.appendChild(groupName);
            newItem.className = 'roomName';

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

                    actions.addEventListener("click", function () {
                        deleteGroup(gids[index]);
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
                    console.log(`roommmmmmmmmmmmm: ${roomName.textContent.replace("Room: ", "").trim()}`);
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

    connection.on("ReceiveMessage", function (msg, i, gid, gname, isReadByAll) {
        console.log("received index is: ", i);
        console.log("received message is: ", msg.content);
        const messages = document.getElementById("messages");
        const userName = getUser();

        const time = getRelativeTime(msg.timestamp);

        const msgType = msg.sender === userName ? "users" : "others";
        const seenClass = isReadByAll ? 'blue-seen-icon' : '';
        console.log("SEENCLASS IN ReceiveMessage: ", seenClass);
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        const chatName = params.get('chat');
        if (chatName === gname) {
            messages.innerHTML += `
        <div class="groupMessage ${msgType}">
            <span class="userSpan">${msg.sender}</span>

            

            <p class="textContent"><br> ${msg.content}</p>
            <div id="forFlex">
                ${msgType === "users" ?
                    `<i class="fas fa-check-double ${seenClass}" style="font-size:24px;"></i> `
                    : ""
                }
             <p class="textTime"><br> ${time || ""}</p>

            </div>
        </div>
    `;
        }

        messages.scrollTop = messages.scrollHeight;


        const groupElement = document.querySelector(`#groups-list li[data-group="${gid}"]`);
        if (groupElement) {
            let badge = groupElement.querySelector('.new-msg-badge');

            const url = new URL(window.location.href);
            const params = new URLSearchParams(url.search);
            const chatName = params.get('chat');

            if (!badge && chatName !== gname) {
                //let currentCount = parseInt(badge.innerText, 10);
                //badge.innerText = `${currentCount + 1}`;
                badge = document.createElement('span');
                badge.className = 'new-msg-badge';
                badge.innerText = `new`;
                groupElement.appendChild(badge);
            }

            if (!groupElement.classList.contains("new-message")) {
                groupElement.classList.add("new-message");
            }
        }
        displayMessage(msg.sender, msg.content);


    });




    connection.on("ReceiveNotification", (notificationMessage, gname) => {

        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        const chatName = params.get('chat');
        if (chatName !== gname) {
            document.getElementById("alertModalBody").innerHTML = `

                <div class="alert alert-success alert-dismissible fade show" role="alert">
                  <p>${notificationMessage}</p>
                </div>
            `;
            $('#alertModal').modal('show');
            console.log("Notification: " + notificationMessage);
        }

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
            const newItem = document.createElement('li');
            newItem.setAttribute('data-group', gids[index]);

            const groupImage = document.createElement('img');
            groupImage.src = "/groupPhoto.jpg";
            groupImage.style.marginRight = '10px';

            newItem.appendChild(groupImage);
            const groupName = document.createElement('p');
            groupName.id = `${roomName}`;
            groupName.innerText = roomName;

            newItem.appendChild(groupName);
            newItem.className = 'roomName';

            const icon = document.createElement('i');
            icon.className = "fa-solid fa-ellipsis-vertical";
            icon.id = gids[index];
            icon.style.float = 'right';
            newItem.appendChild(icon);

            groupDiv.appendChild(newItem);

            icon.addEventListener("click", function (e) {
                e.stopPropagation();

                const existingDiv = document.querySelector(`.delete-div-${gids[index]}`);
                if (existingDiv) {
                    toggleAction(existingDiv);
                }
                else {
                    const actions = document.createElement("div");
                    actions.className = `delete-div-${gids[index]}`;
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

                    document.body.appendChild(actions);

                    const iconRect = e.target.getBoundingClientRect();
                    actions.style.position = "absolute";
                    actions.style.top = `${iconRect.bottom + window.scrollY}px`;
                    actions.style.left = `${iconRect.left + window.scrollX}px`;

                    actions.addEventListener("click", function () {
                        deleteGroup(gids[index]);
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
            if (e.target && e.target.nodeName === "P") {
                const selectedGroup = e.target.textContent.trim();
                const sanitizedGroupName = sanitizeGroupName(selectedGroup);

                console.log(selectedGroup);

                const roomNameElements = document.getElementsByClassName("roomName");
                if (roomNameElements.length > 0) {
                    roomNameElements[0].value = selectedGroup;
                }


                let badge = document.querySelector('.new-msg-badge');
                if (badge) {
                    badge.remove();
                }




                const topBarTitle = document.getElementById("roomTitle");
                topBarTitle.innerText = `Room: ${selectedGroup}`;

                const newUrl = `${window.location.origin}${window.location.pathname}?chat=${encodeURIComponent(sanitizedGroupName)}`;
                history.pushState({ group: sanitizedGroupName }, '', newUrl);

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

                    addMember.setAttribute('data-target', '#addMember');
                    divOfBtns.appendChild(addMember);


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
                const s = statuses[index + 1];
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
        console.log("loading messages from: ", roomName);
        connection.invoke("LoadMessages", roomName).catch(err => console.log(err.toString()));
    }

    connection.on("LoadGroupMessages", function (msgs, isReadByAll) {
        displayMessages(msgs, isReadByAll);
    });


    function getRelativeTime(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffInSeconds = Math.floor((now - then) / 1000);

        const seconds = Math.floor(diffInSeconds % 60);
        const minutes = Math.floor((diffInSeconds / 60) % 60);
        const hours = Math.floor((diffInSeconds / 3600) % 24);
        const days = Math.floor(diffInSeconds / 86400);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (seconds > 0) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;

        return 'just now';
    }


    function displayMessages(messages, isReadByAll) {
        const messagesDiv = document.getElementById("messages");
        messagesDiv.innerHTML = '';

        messages.forEach((msg, index) => {
            const time = getRelativeTime(msg.timestamp);
            const msgType = msg.userName === getUser() ? "users" : "others";
            const seenClass = isReadByAll ? 'blue-seen-icon' : '';
            console.log("SEEN2: ", isReadByAll);


            messagesDiv.innerHTML += `
            <div class="groupMessage ${msgType} message-${index}" data-sender="${msg.userName}" id="message-${msg.id}">
                <div id="forUpperFlex">
                    ${msgType === "users" ? `<i class="msg-actions fa-solid fa-ellipsis-vertical" data-index="${index}" style="cursor:pointer;"></i>` : ''}
                    <span class="userSpan">${msg.userName}</span>
                </div>

                <p class="textContent" id="msg-content-${index}"><br>${msg.content}</p>

                <div id="forFlex">
                    ${msgType === "users" ? `<i class="fas fa-check-double ${seenClass}" style="font-size:24px;"></i>` : ""}
                    <p class="textTime"><br> ${time || ""}</p>
                </div>

                ${msgType === "users" ? `
                    <div class="msg-options" id="msg-options-${index}" style="display:none;">
                        <button class="edit-btn" data-id="${msg.id}" data-index="${index}">Edit</button>
                        <button class="delete-btn" data-id="${msg.id}" data-index="${index}">Delete</button>
                    </div>` : ""}
            </div>
        `;

            console.log("SEEN1: ", msg.seenBy);

            if (!msg.seenBy.includes(getUser()) && getUser() !== msg.userName) {
                console.log("SEEN2: ", msg.seenBy);
                markMessageAsSeen(msg.id, getUser());
            }
        });

        //to toggle visibility of options
        document.querySelectorAll('.msg-actions').forEach(icon => {
            icon.addEventListener('click', function () {
                const index = this.getAttribute('data-index');
                toggleOptions(index);
            });
        });

        //event listeners for edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function () {
                const msgId = this.getAttribute('data-id');
                console.log(`Edit message with ID: ${msgId}`);
                const index = this.getAttribute('data-index');
                performEdit(index, msgId);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function () {
                const msgId = this.getAttribute('data-id');
                console.log("THE DELETE MESSAGE GROUP NAME IS: ", msgId);

                const index = this.getAttribute('data-index');
                console.log("THE DELETE MESSAGE GROUP NAME IS: ", index);

                const roomName = document.getElementById("roomTitle");
                deleteMessage(roomName.textContent.replace("Room: ", "").trim(), msgId, index);
                console.log("THE DELETE MESSAGE GROUP NAME IS: ", roomName.textContent.replace("Room: ", "").trim());
                const msgObj = document.getElementById(`message-${msgId}`);
                msgObj.remove();

            });
        });

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function toggleOptions(index) {
        const optionsDiv = document.getElementById(`msg-options-${index}`);
        if (optionsDiv.style.display === 'none') {
            optionsDiv.style.display = 'block';
        } else {
            optionsDiv.style.display = 'none';
        }
    }

    function performEdit(index, msgId) {
        const msgContent = document.getElementById(`msg-content-${index}`);
        console.log(msgContent);
        const oldText = msgContent.textContent.trim();

        msgContent.innerHTML = `
            <br/>
            <textarea id="edit-input-${index}" class="edit-input">${oldText}</textarea>
            <button id="save-btn-${index}" class="save-btn">Save</button>
            <button id="cancel-btn-${index}" class="cancel-btn">Cancel</button>
    
        `;

        //saving the msg
        document.getElementById(`save-btn-${index}`).addEventListener('click', function () {
            const newText = document.getElementById(`edit-input-${index}`).value.trim();
            if (newText) {
                msgContent.innerHTML = `<br>${newText}`;
                console.log(`Message with ID: ${msgId} updated to: ${newText}`);
                saveEditedMessage(msgId, newText);
            }
        });
        document.getElementById(`cancel-btn-${index}`).addEventListener('click', function () {
            msgContent.innerHTML = `<br>${originalText}`;
        });
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

    function deleteMessage(roomName, msgId, index) {
        connection.invoke("DeleteMessage", roomName, msgId, index).catch(err => console.log(err.toString()));
    }

    function saveEditedMessage(msgId, messageContent) {
        const groupName = getCurrentRoomName();
        connection.invoke("SaveEditedMessage", groupName, msgId, messageContent).catch(err => console.log(err.toString()));
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
            console.log("Added the user to group", userName);
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


    function markMessageAsSeen(messageId, userSeenMessage) {
        console.log("Marking message as seen:", messageId, " by user:", userSeenMessage);
        let groupName = getCurrentRoomName();
        connection.invoke("MarkMessageAsSeen", groupName, messageId, userSeenMessage)
            .catch(function (err) {
                console.error("Error marking message as seen:", err.toString());
            });
    }

    connection.on("MessageSeen", function (messageId, userId) {
        var messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement && userId !== getUser()) {
            var icon = messageElement.querySelector(".fa-check-double");
            if (icon) {
                icon.classList.add("blue-seen-icon");
            }
        }
    });



    //delete the message from the chat and appear immediately
    connection.on("MessageDeleted", function (index) {
        let msgDiv = document.querySelector(`.groupMessage.users.message-${index}`);
        if (!msgDiv) {
            msgDiv = document.querySelector(`.groupMessage.others.message-${index}`);
        }
        else {
            //when sending the message in real time and we want to delete it, it's class name won't be edited unless the other users refreshed the chat page
            msgDiv = document.querySelector(`.groupMessage.message-${index}`);
        }
        if (!msgDiv) {
            return;
        }
        msgDiv.remove();
    });



    connection.on("MessageEdited", function (mid, newContent) {
        console.log("MessageEdited: ", mid);
        const msgDiv = document.getElementById("groups-list");
        const msgToEdit = Array.from(msgDiv.children).find(item => item.querySelector('i').id === mid);
        if (msgToEdit) {
            if (msgToEdit.querySelector('.message-content')) {
                msgToEdit.textContent = newContent;
            }
        }
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

                connection.invoke("AddUserToGroup", roomName.textContent.replace("Room: ", "").trim(), memberInput.value)
                    .catch(err => console.log(err.toString()));
            }
            else {
                alert("Please enter a memberInput name or check that you're signed in");
            }
        });
    });


    connection.on("GroupDeleted", function (gid) {
        console.log("GroupDeleted: ", gid);
        const groupDiv = document.getElementById("groups-list");
        const groupToDelete = Array.from(groupDiv.children).find(item => item.querySelector('i').id === gid);
        if (groupToDelete) groupToDelete.remove();
    });


    function getCurrentRoomName() {
        const roomName = document.getElementById("roomTitle");
        return roomName.textContent.replace("Room: ", "").trim()
    }
}



else {
    console.error('Connection is not defined, cannot register event handlers.');
}