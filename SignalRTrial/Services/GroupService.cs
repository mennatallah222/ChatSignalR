using MongoDB.Driver;
using SignalRTrial.Entities;

namespace SignalRTrial.Services
{
    public class GroupService
    {
        private readonly IMongoCollection<Group> _groups;
        public GroupService(IMongoDatabase database)
        {
            _groups = database.GetCollection<Group>("Groups");
        }

        public async Task<Group> CreateGroupAsync(Group group)
        {
            await _groups.InsertOneAsync(group);
            return group;
        }

        public async Task<List<string>> GetGroupsIds(string uid)
        {
            var filteredGroups = Builders<Group>.Filter.AnyEq(g => g.Members, uid);
            var groups = await _groups.Find(filteredGroups).ToListAsync();

            var gids = new List<string>();
            foreach (var group in groups)
            {
                gids.Add(group.Id);
            }
            return gids;
        }

        public async Task<Group> GetGroupByIdAsync(string id)
        {
            return await _groups.Find(g => g.Id == id).FirstOrDefaultAsync();
        }

        public async Task<Group> GetGroupByNameAsync(string name)
        {
            return await _groups.Find(g => g.Name == name).FirstOrDefaultAsync();
        }

        public async Task AddMemberToGroupAsync(string gid, string uid)
        {
            var update = Builders<Group>.Update.Push(g => g.Members, uid);
            await _groups.UpdateOneAsync(g => g.Id == gid, update);
        }

        public async Task RemoveMemberFromGroupAsync(string gid, string uid)
        {
            var update = Builders<Group>.Update.Pull(g => g.Members, uid);
            await _groups.UpdateOneAsync(g => g.Id == gid, update);
        }

        public async Task DeleteGroupAsync(string id)
        {
            await _groups.DeleteOneAsync(u => u.Id == id);
        }

        public async Task<List<Group>> GetUserGroupsAsync(ICollection<string> groupIds)
        {
            var filter = Builders<Group>.Filter.In(g => g.Id, groupIds);

            var groups = await _groups.Find(filter).ToListAsync();

            return groups;
        }
    }
}
