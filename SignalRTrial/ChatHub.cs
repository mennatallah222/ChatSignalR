//using Microsoft.AspNetCore.SignalR;
//using System.Collections.Concurrent;

//namespace SignalRTrial
//{
//    //public record User(string name, string room);
//    //public record Message(string name, string text);
//    public class ChatHub : Hub
//    {
//        private static ConcurrentDictionary<string, User> _users = new();

//        public override async Task OnDisconnectedAsync(Exception? exception)
//        {
//            if (_users.TryRemove(Context.ConnectionId, out var user))
//            {
//                await Groups.RemoveFromGroupAsync(Context.ConnectionId, user.room);
//                await Clients.Group(user.room).SendAsync("UserLeft", user.name);
//            }

//            await base.OnDisconnectedAsync(exception);
//        }

//        public async Task JoinedRoom(string roomName, string userName)
//        {
//            var user = new User(userName, roomName);
//            _users[Context.ConnectionId] = user;

//            await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
//            await Clients.Group(roomName).SendAsync("UserJoined", userName);
//        }

//        public async Task SendMessageToRoom(string roomName, string message)
//        {
//            var user = _users[Context.ConnectionId];
//            var msg = new Message(user.name, message);

//            await Clients.OthersInGroup(roomName).SendAsync("ReceiveMessage", msg);
//        }
//    }

//}
