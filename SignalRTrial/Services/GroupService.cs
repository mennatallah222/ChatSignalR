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

    }
}
