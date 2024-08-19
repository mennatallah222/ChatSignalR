using MongoDB.Bson.Serialization.Attributes;

namespace SignalRTrial.Entities
{
    public class Group
    {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string Id { get; set; }
        public string? Name { get; set; }
        //public string AdminId { get; set; }
        public ICollection<string>? Members { get; set; }
        public ICollection<string>? Messages { get; set; }

        public Group()
        {
            Members = new HashSet<string>();
            Messages = new HashSet<string>();
        }
    }
}
