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

        public async Task Logout()
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

            await Clients.Caller.SendAsync("LoggedOut", "You have been logged out.");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // The user might have disconnected unexpectedly
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

            var gids = await _groupService.GetGroupsIds(uid);
            userInfo.GroupIds = gids;
            _connections[Context.ConnectionId] = userInfo;

            var user = await _userService.GetUserByIdAsync(uid);
            if (user == null)
            {
                user = new User { UserName = userName, Email = email, GroupsIds = gids, Status = "online" };
                await _userService.CreateUserAsync(user);
            }

            else
            {
                user.Status = "online";
                user.GroupsIds = gids;
                await _userService.UpdateUserAsync(user.Id, user);
            }
            var userGroups = await _groupService.GetUserGroupsAsync(user.GroupsIds);
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
                group = new GroupChat { Name = roomName, Members = new List<string> { uid } };
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
            await Clients.Caller.SendAsync("AddToGroupsDiv", userGroups.Select(g => g.Name).ToList(), userGroups.Select(g => g.Id).ToList());
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


        private static Dictionary<string, int> _messageCount = new Dictionary<string, int>();
        public async Task SendMessageToRoom(string roomName, string message)
        {
            if (_connections.TryGetValue(Context.ConnectionId, out var userInfo))
            {
                var uid = userInfo.UserId;
                Console.WriteLine($"current userInfo.UserId is: {uid}");

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

                    group.Messages.Add(msg.Content);

                    await _messageService.CreateMessageAsync(msg);
                    //await Clients.Group(roomName).SendAsync("ReceiveMessage", new { sender = userInfo.UserName, content = message });
                    await Groups.AddToGroupAsync(Context.ConnectionId, roomName);

                    if (!_messageCount.ContainsKey(roomName))
                    {
                        _messageCount[roomName] = 0;
                    }
                    _messageCount[roomName]++;
                    //Console.WriteLine($"TIME IS: {msg.Timestamp.Value.ToString("HH:mm:ss")}");
                    var formattedTime = msg.Timestamp.Value.ToString("HH:mm:ss");
                    await Clients.OthersInGroup(roomName).SendAsync("ReceiveMessage", new { sender = userInfo.UserName, content = message, time = formattedTime }, _messageCount[roomName], group.Id, group.Name);

                    Console.WriteLine($"Room is: {group.Name} has message: {msg.Content}");
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
            Console.WriteLine("im in load messages");
            if (_connections.TryGetValue(Context.ConnectionId, out var userInfo))
            {
                var uid = await _userService.GetUserIdByUserNameAsync(userInfo.UserName);
                Console.WriteLine($"im in load messages and this is uid {uid}");

                var group = await _groupService.GetGroupByNameAsync(roomName);
                if (group != null)
                {
                    var messages = await _messageService.GetMessagesForChatAsync(group.Id);
                    Console.WriteLine($"im in load messages and this is group name {group.Name}");

                    await Clients.Caller.SendAsync("LoadGroupMessages", messages);
                }
            }
        }

        public async Task DeleteGroup(string gid)
        {
            var group = await _groupService.GetGroupByIdAsync(gid);
            var gname = group.Name;
            var membersIds = group.Members?.ToList() ?? new List<string>();
            var users = await _userService.GetUsersInGroupsAsync(membersIds);
            foreach (var u in users)
            {
                //await _userService.ExitFromGroup(gid, u.Id);

                //notifying them in real time
                var uinfo = _connections.Values.FirstOrDefault(info => info.UserId == u.Id);
                if (uinfo != null && uinfo.ConnectionId != null)
                {
                    await Clients.Client(uinfo.ConnectionId).SendAsync("GroupDeleted", gid);
                    await Clients.Group(gname).SendAsync("GroupDeleted", gid);

                }
            }
            await _groupService.DeleteGroupAsync(gid);

        }

        public async Task DeleteMessage(string groupName, string mid)
        {
            var msg = await _messageService.GetMessageByIdAsync(mid);
            Console.WriteLine($"msg: {msg}");
            var group = await _groupService.GetGroupByNameAsync(groupName);
            Console.WriteLine($"groupName: {groupName}");


            var membersIds = group.Members?.ToList() ?? new List<string>();
            var users = await _userService.GetUsersInGroupsAsync(membersIds);
            Console.WriteLine($"users: {users}");


            foreach (var u in users)
            {
                var uinfo = _connections.Values.FirstOrDefault(info => info.UserId == u.Id);
                if (uinfo != null && uinfo.ConnectionId != null)
                {
                    await Clients.Client(uinfo.ConnectionId).SendAsync("MessageDeleted", mid);
                    Console.WriteLine($"inside loop");

                    await Clients.All.SendAsync("MessageDeleted", mid);

                }
            }
            await _messageService.DeleteMessageAsync(mid);

        }


        private async Task NotifyGroupMembers(string groupName, string message)
        {
            var notificationMessage = $"New message in group {groupName}: {message}";

            var group = await _groupService.GetGroupByNameAsync(groupName);

            var membersIds = group.Members?.ToList() ?? new List<string>();
            var users = await _userService.GetUsersInGroupsAsync(membersIds);
            foreach (var u in users)
            {
                //await _userService.ExitFromGroup(gid, u.Id);

                //notifying them in real time
                var uinfo = _connections.Values.FirstOrDefault(info => info.UserId == u.Id);
                if (uinfo != null && uinfo.ConnectionId != null)
                {
                    await Clients.OthersInGroup(groupName).SendAsync("ReceiveNotification", notificationMessage, group.Name);

                }
            }
            //await Clients.OthersInGroup(groupName).SendAsync("ReceiveNotification", notificationMessage);
        }



        public async Task AddUserToGroup(string groupName, string userName)
        {
            var userId = await _userService.GetUserIdByUserNameAsync(userName);
            var userInfo = _connections.Values.FirstOrDefault(info => info.UserName == userName);

            if (userInfo == null)
            {
                await Clients.Caller.SendAsync("Error", "User not found.");
                return;
            }

            var user = await _userService.GetUserByIdAsync(userId);

            if (user == null)
            {
                await Clients.Caller.SendAsync("Error", "User details not found.");
                return;
            }

            var group = await _groupService.GetGroupByNameAsync(groupName);
            if (group == null)
            {
                group = new GroupChat { Name = groupName, Members = new List<string> { userId } };
                await _groupService.CreateGroupAsync(group);
            }
            else if (!group.Members.Contains(userId))
            {
                group.Members.Add(userId);
                await _groupService.UpdateGroupAsync(group.Id, group);
            }

            if (!user.GroupsIds.Contains(group.Id))
            {
                user.GroupsIds.Add(group.Id);
                await _userService.UpdateUserAsync(user.Id, user);
            }

            if (userInfo.ConnectionId != null)
            {
                var userGroups = await _groupService.GetUserGroupsAsync(user.GroupsIds);

                await Clients.Client(userInfo.ConnectionId).SendAsync("AddToGroupsDiv", userGroups.Select(g => g.Name).ToList(), userGroups.Select(g => g.Id).ToList());
            }
            else
            {
                // Handle case where userInfo.ConnectionId is null
                await Clients.Caller.SendAsync("Error", "Unable to notify user.");
            }
        }



    }

}
