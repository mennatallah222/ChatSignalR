using MongoDB.Driver;
using SignalRTrial.Entities;

namespace SignalRTrial.Services
{
    public class MessageService
    {
        private readonly IMongoCollection<Message> _messages;
        public MessageService(IMongoDatabase database)
        {
            _messages = database.GetCollection<Message>("Messages");
        }

        public async Task<Message> CreateMessageAsync(Message message)
        {
            await _messages.InsertOneAsync(message);
            return message;
        }

        //public async Task<Message> GetMessageByIdAsync(string id)
        //{

        //    return await _messages.Find(m => m.Id == id).FirstOrDefaultAsync();
        //}

        //public async Task UpdateMessageAsync(string id, Message updatedMessage)
        //{
        //    await _messages.ReplaceOneAsync(m => m.Id == id, updatedMessage);
        //}

        public async Task DeleteMessageAsync(string id)
        {
            await _messages.DeleteOneAsync(u => u.Id == id);
        }

        public async Task<List<Message>> GetMessagesForChatAsync(string groupId)
        {
            // Filter messages by the GroupId to fetch all messages in the group
            return await _messages.Find(m => m.GroupId == groupId).ToListAsync();
        }
        //public async Task<List<Message>> GetMessagesForChatAsync(string uid1, string uid2)
        //{
        //    return await _messages.Find(m =>
        //    (m.SenderId == uid1 || m.RecieverId == uid2) ||
        //    (m.SenderId == uid2 || m.RecieverId == uid1)
        //    ).ToListAsync();
        //}
    }
}
