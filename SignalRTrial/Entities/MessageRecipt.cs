using MongoDB.Bson.Serialization.Attributes;

namespace SignalRTrial.Entities
{
    public class MessageRecipt
    {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public int Id { get; set; }
        public int MessageId { get; set; }
        public int UserId { get; set; }
        public DateTime SeenTime { get; set; }

    }
}
