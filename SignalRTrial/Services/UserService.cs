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

        public async Task<string> GetUserIdByUserNameAsync(string userName)
        {
            var user = await _users.Find(u => u.UserName == userName).FirstOrDefaultAsync();
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

    }
}