using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace SignalRTrial.Hubs
{
    public record User(string name, string room);
    public record Message(string name, string text);
    public record Group(string name);
    public class ChatHub : Hub
    {
        private static ConcurrentDictionary<string, User> _users = new();

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_users.TryRemove(Context.ConnectionId, out var user))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, user.room);
                await Clients.Group(user.room).SendAsync("UserLeft", user.name);
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinedRoom(string roomName, string userName)
        {
            var user = new User(userName, roomName);
            _users[Context.ConnectionId] = user;

            await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
            await Clients.Group(roomName).SendAsync("UserJoined", userName);

            await Clients.Caller.SendAsync("AddToGroupsDiv", roomName);
        }

        public async Task SendMessageToRoom(string roomName, string message)
        {
            var user = _users[Context.ConnectionId];
            var msg = new Message(user.name, message);

            await Clients.Group(roomName).SendAsync("ReceiveMessage", msg);
            await NotifyGroupMembers(roomName, message);
        }

        private async Task NotifyGroupMembers(string groupName, string message)
        {
            var notificationMessage = $"New message in group {groupName}: {message}";

            await Clients.OthersInGroup(groupName).SendAsync("ReceiveNotification", notificationMessage);
        }

    }

}
