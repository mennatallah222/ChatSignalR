using MongoDB.Bson.Serialization.Attributes;

namespace SignalRTrial.Entities
{
    public class GroupChat
    {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string Id { get; set; }
        public string? Name { get; set; }
        //public string AdminId { get; set; }
        public ICollection<string>? Members { get; set; }
        public ICollection<string>? Messages { get; set; }

        public GroupChat()
        {
            Members = new HashSet<string>();
            Messages = new HashSet<string>();
        }
    }
}
