using MongoDB.Driver;
using SignalRTrial.Entities;

namespace SignalRTrial.Services
{
    public class GroupService
    {
        private readonly IMongoCollection<GroupChat> _groups;
        private readonly IMongoCollection<Message> _messages;

        private readonly IMongoCollection<User> _users;
        private readonly IMongoCollection<UserGroupMessages> _userGroupMessages;
        public GroupService(IMongoDatabase database)
        {
            _groups = database.GetCollection<GroupChat>("Groups");
            _users = database.GetCollection<User>("User");
            _messages = database.GetCollection<Message>("Messages");
            _userGroupMessages = database.GetCollection<UserGroupMessages>("UserGroupMessages");
        }

        public async Task<GroupChat> CreateGroupAsync(GroupChat group)
        {
            await _groups.InsertOneAsync(group);
            return group;
        }

        public async Task<List<string>> GetGroupsIds(string uid)
        {
            var filteredGroups = Builders<GroupChat>.Filter.AnyEq(g => g.Members, uid);
            var groups = await _groups.Find(filteredGroups).ToListAsync();

            var gids = new List<string>();
            foreach (var group in groups)
            {
                gids.Add(group.Id);
            }
            return gids;
        }

        public async Task<GroupChat> GetGroupByIdAsync(string id)
        {
            return await _groups.Find(g => g.Id == id).FirstOrDefaultAsync();
        }

        public async Task<GroupChat> GetGroupByNameAsync(string name)
        {
            return await _groups.Find(g => g.Name == name).FirstOrDefaultAsync();
        }

        public async Task AddMemberToGroupAsync(string gid, string uid)
        {
            var update = Builders<GroupChat>.Update.Push(g => g.Members, uid);
            await _groups.UpdateOneAsync(g => g.Id == gid, update);
        }

        public async Task RemoveMemberFromGroupAsync(string gid, string uid)
        {
            var update = Builders<GroupChat>.Update.Pull(g => g.Members, uid);
            await _groups.UpdateOneAsync(g => g.Id == gid, update);
        }

        public async Task DeleteGroupAsync(string id)
        {
            await _groups.DeleteOneAsync(u => u.Id == id);
        }

        public async Task<List<GroupChat>> GetUserGroupsAsync(ICollection<string> groupIds)
        {
            var filter = Builders<GroupChat>.Filter.In(g => g.Id, groupIds);

            var groups = await _groups.Find(filter).ToListAsync();

            return groups;
        }

        public async Task UpdateGroupAsync(string gid, GroupChat groupChat)
        {
            var filter = Builders<GroupChat>.Filter.Eq(g => g.Id, gid);
            var update = Builders<GroupChat>.Update
                .Set(g => g.Name, groupChat.Name)
                .Set(G => G.Members, groupChat.Members);
            await _groups.UpdateOneAsync(filter, update);
        }

        public async Task<List<User>> GetGroupUsersAsync(string gid)
        {
            var userGroupList = await _users.Find(ug => ug.GroupsIds.FirstOrDefault() == gid).ToListAsync();
            var uids = userGroupList.Select(ug => ug.Id).ToList();
            return await _users.Find(u => uids.Contains(u.Id)).ToListAsync();
        }

        public async Task<UserGroupMessages> GetUserGroupMessagesAsync(string userId, string groupId)
        {
            return await _userGroupMessages.Find(ug => ug.UserId == userId && ug.GroupId == groupId).FirstOrDefaultAsync();
        }

        public async Task CreateUserGroupMessagesAsync(UserGroupMessages userGroupMessages)
        {
            await _userGroupMessages.InsertOneAsync(userGroupMessages);
        }

        public async Task UpdateUserGroupMessagesAsync(UserGroupMessages userGroupMessages)
        {
            var filter = Builders<UserGroupMessages>.Filter.And(
                Builders<UserGroupMessages>.Filter.Eq(ug => ug.UserId, userGroupMessages.UserId),
                Builders<UserGroupMessages>.Filter.Eq(ug => ug.GroupId, userGroupMessages.GroupId)
            );
            await _userGroupMessages.ReplaceOneAsync(filter, userGroupMessages);
        }

        public async Task<List<Message>> GetMessagesByIdsAsync(IEnumerable<string> messageIds)
        {
            return await _messages.Find(m => messageIds.Contains(m.Id)).ToListAsync();
        }

    }
}
