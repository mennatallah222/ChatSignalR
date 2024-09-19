using MongoDB.Driver;
using SignalRTrial.Entities;

namespace SignalRTrial.Services
{
    public class MessageService
    {
        private readonly IMongoCollection<Message> _messages;
        private readonly IMongoCollection<UserGroupMessages> _userGroupMessages;
        public MessageService(IMongoDatabase database)
        {
            _messages = database.GetCollection<Message>("Messages");
            _userGroupMessages = database.GetCollection<UserGroupMessages>("UserGroupMessages");
        }

        public async Task<Message> CreateMessageAsync(Message message)
        {
            await _messages.InsertOneAsync(message);
            return message;
        }

        public async Task<Message> GetMessageByIdAsync(string id)
        {

            return await _messages.Find(m => m.Id == id).FirstOrDefaultAsync();
        }

        public async Task UpdateMessageAsync(string id, Message updatedMessage)
        {
            await _messages.ReplaceOneAsync(m => m.Id == id, updatedMessage);
        }

        public async Task DeleteMessageAsync(string id)
        {
            await _messages.DeleteOneAsync(u => u.Id == id);
        }

        public async Task<List<Message>> GetMessagesForChatAsync(string groupId)
        {
            return await _messages.Find(m => m.GroupId == groupId).ToListAsync();
        }


        public async Task MarkMessageAsSeenAsync(string messageId, string userId)
        {
            var filter = Builders<Message>.Filter.Eq(m => m.Id, messageId);
            var update = Builders<Message>.Update.AddToSet(m => m.SeenBy, userId);
            await _messages.UpdateOneAsync(filter, update);
        }


        public async Task AddReactionToMessage(string messageId, string userId, string reactionType)
        {
            var filter = Builders<Message>.Filter.Eq(m => m.Id, messageId);
            var update = Builders<Message>.Update.AddToSet(m => m.Reactions, new Reaction
            {
                UserId = userId,
                ReactionType = reactionType,
            });

            await _messages.UpdateOneAsync(filter, update);
        }
    }
}
