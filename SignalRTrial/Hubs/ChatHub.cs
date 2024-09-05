using Microsoft.AspNetCore.SignalR;
using SignalRTrial.Configurations;
using SignalRTrial.Entities;
using SignalRTrial.Services;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace SignalRTrial.Hubs
{
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

        //private static ConcurrentDictionary<string, string> _connections = new();
        //private readonly ConcurrentDictionary<string, string> _connections = new ConcurrentDictionary<string, string>();


        private static ConcurrentDictionary<string, UserConnectionInfo> _connections = new();

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_connections.TryRemove(Context.ConnectionId, out var userInfo))
            {
                var user = await _userService.GetUserByIdAsync(userInfo.UserId);

                if (user != null)
                {
                    user.Status = "offline";
                    await _userService.UpdateUserAsync(userInfo.UserId, user);

                    foreach (var group in user.GroupsIds)
                    {
                        await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
                        await Clients.Group(group).SendAsync("UserLeft", userInfo.UserName);
                    }
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("WelcomeMessage", "Welcome to the chat!");

            await base.OnConnectedAsync();
        }



        public async Task SignUp(string userName, string email)
        {
            var uid = await _userService.GetUserIdByUserNameAsync(userName);

            var userInfo = new UserConnectionInfo
            {
                UserId = uid,
                ConnectionId = Context.ConnectionId,
                UserName = userName
            };

            _connections[Context.ConnectionId] = userInfo;

            var user = await _userService.GetUserByIdAsync(uid);
            if (user == null)
            {
                user = new User { UserName = userName, Email = email, GroupsIds = new List<string>(), Status = "online" };
                await _userService.CreateUserAsync(user);
            }
            user.Status = "online";
            await _userService.UpdateUserAsync(userInfo.UserId, user);

            var gids = await _groupService.GetGroupsIds(uid);
            var userGroups = await _groupService.GetUserGroupsAsync(user.GroupsIds);


            await base.OnConnectedAsync();
            user.Status = "online";
            await Clients.Caller.SendAsync("SignUp", userGroups.Select(g => g.Name).ToList(), userGroups.Select(g => g.Id).ToList());
            await Clients.All.SendAsync("UserJoined", userName);
        }

        public async Task JoinedRoom(string roomName, string userName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomName);

            var uid = await _userService.GetUserIdByUserNameAsync(userName);
            var userInfo = new UserConnectionInfo
            {
                UserId = uid,
                ConnectionId = Context.ConnectionId,
                UserName = userName
            };

            //_connections[Context.ConnectionId] = userInfo;

            var user = await _userService.GetUserByIdAsync(uid);
            var group = await _groupService.GetGroupByNameAsync(roomName);
            if (group == null)
            {
                group = new SignalRTrial.Entities.Group { Name = roomName, Members = new List<string> { uid } };
                await _groupService.CreateGroupAsync(group);
            }

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

            var targetConnectionId = userInfo.ConnectionId;
            await Clients.Client(targetConnectionId).SendAsync("AddToGroupsDiv", userGroups.Select(g => g.Name).ToList(), userGroups.Select(g => g.Id).ToList());
            Console.WriteLine($"connection id is:{targetConnectionId} and user is: {userInfo.UserName}");
            await Clients.Group(roomName).SendAsync("UserJoined", user.UserName);
        }

        public async Task LoadMembers(string roomName)
        {
            if (_connections.TryGetValue(Context.ConnectionId, out var userInfo))
            {
                var group = await _groupService.GetGroupByNameAsync(roomName);
                var membersIds = group.Members?.ToList() ?? new List<string>();
                var membersNames = await _userService.GetUsersInGroupsAsync(membersIds);

                var sanitizedGroupName = SanitizeGroupName(group.Name);

                //sending the members to the groups secreens
                await Clients.Caller.SendAsync("DisplayMembers", membersNames.Select(m => m.UserName), membersNames.Select(m => m.Status), sanitizedGroupName);
            }
        }

        private string SanitizeGroupName(string groupName)
        {
            return Regex.Replace(groupName, @"[^a-zA-Z0-9-_]", "");
        }

        public async Task SendMessageToRoom(string roomName, string message)
        {
            if (_connections.TryGetValue(Context.ConnectionId, out var userInfo))
            {
                var uid = userInfo.UserId;
                var group = await _groupService.GetGroupByNameAsync(roomName);

                if (group != null)
                {
                    var msg = new Message
                    {
                        SenderId = uid,
                        UserName = userInfo.UserName,
                        RecieverId = group.Id,
                        GroupId = group.Id,
                        Content = message,
                        Timestamp = DateTime.Now
                    };

                    if (group.Messages == null)
                    {
                        group.Messages = new List<string>();
                    }

                    group.Messages.Append(msg.Content);

                    await _messageService.CreateMessageAsync(msg);
                    await Clients.Group(roomName).SendAsync("ReceiveMessage", new { sender = userInfo.UserName, content = message });
                    await NotifyGroupMembers(roomName, message);
                }
                else
                {
                    await Clients.Caller.SendAsync("Error", "Group does not exist.");
                }
            }
        }



        public async Task LoadMessages(string roomName)
        {
            if (_connections.TryGetValue(Context.ConnectionId, out var userInfo))
            {
                var uid = await _userService.GetUserIdByUserNameAsync(userInfo.UserName);
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
