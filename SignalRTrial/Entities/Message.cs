using MongoDB.Bson.Serialization.Attributes;

namespace SignalRTrial.Entities
{
    public class Message
    {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string Id { get; set; }
        public string SenderId { get; set; }
        public string UserName { get; set; }
        public string? RecieverId { get; set; }
        public string? GroupId { get; set; }
        public string? Content { get; set; }
        public DateTime? Timestamp { get; set; }
        public List<string> SeenBy { get; set; } = new List<string>();

        public Message()
        {

        }
        public Message(string senderId, string content)
        {
            SenderId = senderId;
            Content = content;
            Timestamp = DateTime.UtcNow;
        }

        public Message(string senderId, string groupId, string content, bool isGroupMessage)
        {
            SenderId = senderId;
            GroupId = groupId;
            Content = content;
            Timestamp = DateTime.UtcNow;
        }
    }
}
