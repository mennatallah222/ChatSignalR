using MongoDB.Driver;
using SignalRTrial.Entities;

namespace SignalRTrial.Services
{
    public class UserService
    {
        private readonly IMongoCollection<User> _users;
        public UserService(IMongoDatabase database)
        {
            _users = database.GetCollection<User>("Users");
        }

        public async Task<User> CreateUserAsync(User user)
        {
            await _users.InsertOneAsync(user);
            return user;
        }

        public async Task<User> GetUserByIdAsync(string id)
        {
            return await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
        }

        public async Task<User> GetUserByUserNameAsync(string username)
        {

            return await _users.Find(u => u.UserName == username).FirstOrDefaultAsync();
        }

        public async Task<string> GetUserIdByUserNameAsync(string userName)
        {
            var user = await GetUserByUserNameAsync(userName);
            return user?.Id;
        }

        public async Task UpdateUserAsync(string id, User updatedUser)
        {
            await _users.ReplaceOneAsync(u => u.Id == id, updatedUser);
        }

        public async Task DeleteUserAsync(string id)
        {
            await _users.DeleteOneAsync(u => u.Id == id);
        }

        public async Task ExitFromGroup(string gid, string uid)
        {
            var update = Builders<User>.Update.Pull(g => g.GroupsIds, gid);

            var result = await _users.UpdateOneAsync(u => u.Id == uid, update);
            if (result.ModifiedCount == 0)
            {
                // Handle the case where the user's document was not modified (e.g., log a warning)
                Console.WriteLine($"No group with ID {gid} was found in the user's groups.");
            }
        }

        public async Task<List<User>> GetUsersAsync()
        {
            var uids = Builders<User>.Filter.Empty;
            var users = await _users.Find(uids).ToListAsync();
            return users;
        }
    }
}