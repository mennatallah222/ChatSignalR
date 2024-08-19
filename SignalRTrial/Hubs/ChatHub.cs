using Microsoft.AspNetCore.SignalR;
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
                var user = await _userService.GetUserByIdAsync(uid);
                if (user != null)
                {
                    foreach (var group in user.Groups)
                    {
                        await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
                        await Clients.Group(group).SendAsync("UserLeft", user.UserName);
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinedRoom(string roomName, string userName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomName);

            _connections[Context.ConnectionId] = userName;

            var uid = await _userService.GetUserIdByUserNameAsync(userName);
            var user = await _userService.GetUserByIdAsync(uid);

            if (user == null)
            {
                user = new User { UserName = userName, Groups = new List<string> { roomName } };
                await _userService.CreateUserAsync(user);
            }
            else
            {
                if (!user.Groups.Contains(roomName))
                {
                    user.Groups.Add(roomName);
                    await _userService.UpdateUserAsync(uid, user);
                }

            }

            //check for the group
            var group = await _groupService.GetGroupByNameAsync(roomName);
            if (group == null)
            {
                group = new Group { Name = roomName, Members = new List<string> { uid } };
                await _groupService.CreateGroupAsync(group);
            }
            else
            {
                //if the group exists, just add the user to it if it's not a member already
                if (!group.Members.Contains(uid))
                {
                    await _groupService.AddMemberToGroupAsync(group.Id, uid);
                }
            }

            await Clients.Caller.SendAsync("AddToGroupsDiv", user.Groups);


            await Clients.Group(roomName).SendAsync("UserJoined", user.UserName);
        }

        public async Task SendMessageToRoom(string roomName, string message)
        {
            if (_connections.TryGetValue(Context.ConnectionId, out var userName))
            {
                var msg = new Message(userName, message);
                await Clients.Group(roomName).SendAsync("ReceiveMessage", new { senderId = userName, content = message });
                await NotifyGroupMembers(roomName, message);
            }
        }

        private async Task NotifyGroupMembers(string groupName, string message)
        {
            var notificationMessage = $"New message in group {groupName}: {message}";

            await Clients.OthersInGroup(groupName).SendAsync("ReceiveNotification", notificationMessage);
        }

    }

}
