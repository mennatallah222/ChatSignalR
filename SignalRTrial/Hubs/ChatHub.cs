using Microsoft.AspNetCore.SignalR;
using MongoDB.Bson;
using SignalRTrial.Entities;
using SignalRTrial.Services;
using System.Collections.Concurrent;

namespace SignalRTrial.Hubs
{
    //public record User(string name, string room);
    //public record Message(string name, string text);
    //public record Group(string name);
    public class ChatHub : Hub
    {
        private readonly UserService _userService;
        private readonly MessageService _messageService;
        private readonly GroupService _groupService;

        public ChatHub(UserService userService,
                        MessageService messageService,
                        GroupService groupService)
        {
            _userService = userService;
            _messageService = messageService;
            _groupService = groupService;
        }

        private static ConcurrentDictionary<string, string> _connections = new();

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_connections.TryRemove(Context.ConnectionId, out var uid))
            {
                if (ObjectId.TryParse(uid, out var objectId))
                {
                    var user = await _userService.GetUserByIdAsync(uid);
                    if (user != null)
                    {
                        foreach (var group in user.GroupsIds)
                        {
                            await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
                            await Clients.Group(group).SendAsync("UserLeft", user.UserName);
                        }
                    }
                }
                else
                {
                    // Log or handle the situation where uid is not a valid ObjectId
                    Console.WriteLine($"Invalid ObjectId: {uid}");
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        //the sign in
        public async Task JoinedRoom(string userName, string email)
        {
            var uid = await _userService.GetUserIdByUserNameAsync(userName);
            var user = await _userService.GetUserByIdAsync(uid);

            if (user == null)
            {
                user = new User { UserName = userName, Email = email, GroupsIds = new List<string>() };
                await _userService.CreateUserAsync(user);
            }

            var gids = await _groupService.GetGroupsIds(uid);

            var userGroups = await _groupService.GetUserGroupsAsync(user.GroupsIds);
            var groupNames = userGroups.Select(g => g.Name).ToList();
            var groupIds = userGroups.Select(g => g.Id).ToList();

            Console.WriteLine("Group Names: " + string.Join(", ", groupNames));
            Console.WriteLine("Group IDs: " + string.Join(", ", groupIds));
            // Send back the user's groups or any other relevant information
            await Clients.Caller.SendAsync("JoinedRoom", user.GroupsIds, gids);

            // Notify all connected clients that a new user has signed in (if needed)
            await Clients.All.SendAsync("UserJoined", userName);
        }


        public async Task JoinedRoom2(string roomName, string userName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
            _connections[Context.ConnectionId] = userName;
            var uid = await _userService.GetUserIdByUserNameAsync(userName);
            var user = await _userService.GetUserByIdAsync(uid);
            //check for the group
            var group = await _groupService.GetGroupByNameAsync(roomName);
            if (group == null)
            {
                group = new Group { Name = roomName, Members = new List<string> { uid } };
                await _groupService.CreateGroupAsync(group);
            }

            //if the group exists, just add the user to it if it's not a member already
            if (!group.Members.Contains(uid))
            {
                await _groupService.AddMemberToGroupAsync(group.Id, uid);
            }
            if (!user.GroupsIds.Contains(group.Id))
            {
                user.GroupsIds.Add(group.Id);
                await _userService.UpdateUserAsync(uid, user);
            }
            var userGroups = await _groupService.GetUserGroupsAsync(user.GroupsIds);


            await Clients.Caller.SendAsync("AddToGroupsDiv", userGroups.Select(g => g.Name).ToList(), userGroups.Select(g => g.Id).ToList());


            await Clients.Group(roomName).SendAsync("UserJoined", user.UserName);
        }

        public async Task SendMessageToRoom(string roomName, string message)
        {
            if (_connections.TryGetValue(Context.ConnectionId, out var userName))
            {
                var uid = await _userService.GetUserIdByUserNameAsync(userName);
                var group = await _groupService.GetGroupByNameAsync(roomName);
                var msg = new Message
                {
                    SenderId = uid,
                    UserName = userName,
                    RecieverId = group.Id,
                    GroupId = group.Id,
                    Content = message,
                    Timestamp = DateTime.Now
                };
                group.Messages?.Add(msg.Content);
                await _messageService.CreateMessageAsync(msg);
                await Clients.Group(roomName).SendAsync("ReceiveMessage", new { sender = userName, content = message });
                await NotifyGroupMembers(roomName, message);
            }
        }

        public async Task LoadMessages(string roomName)
        {
            if (_connections.TryGetValue(Context.ConnectionId, out var userName))
            {
                var uid = await _userService.GetUserIdByUserNameAsync(userName);
                var group = await _groupService.GetGroupByNameAsync(roomName);
                if (group != null)
                {
                    var messages = await _messageService.GetMessagesForChatAsync(group.Id);
                    await Clients.Caller.SendAsync("LoadGroupMessages", messages);
                }
            }
        }

        public async Task DeleteGroup(string gid)
        {
            var group = await _groupService.GetGroupByIdAsync(gid);
            var gname = await _groupService.GetGroupByNameAsync(gid);
            var users = await _userService.GetUsersAsync();
            foreach (var u in users)
            {
                await _userService.ExitFromGroup(gid, u.Id);
            }
            await _groupService.DeleteGroupAsync(gid);
        }

        private async Task NotifyGroupMembers(string groupName, string message)
        {
            var notificationMessage = $"New message in group {groupName}: {message}";

            await Clients.OthersInGroup(groupName).SendAsync("ReceiveNotification", notificationMessage);
        }

    }

}
