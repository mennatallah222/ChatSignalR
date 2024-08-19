using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations.Schema;

namespace SignalRTrial.Entities
{
    public class Message
    {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string Id { get; set; }
        public string SenderId { get; set; }
        [ForeignKey("SenderId")]
        public User? User { get; set; }
        public string? RecieverId { get; set; }
        public string? GroupId { get; set; }
        public string? Content { get; set; }
        public DateTime? Timestamp { get; set; }

        public Message(string senderId, string content)
        {
            SenderId = senderId;
            Content = content;
            Timestamp = DateTime.UtcNow;
        }
    }
}
