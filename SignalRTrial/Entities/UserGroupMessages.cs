using MongoDB.Bson.Serialization.Attributes;

namespace SignalRTrial.Entities
{
    public class UserGroupMessages
    {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string Id { get; set; }
        public string? UserId { get; set; }
        public string? GroupId { get; set; }

        public List<string>? NewMessages { get; set; } = new List<string>();

    }
}
