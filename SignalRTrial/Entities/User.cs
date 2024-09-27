using MongoDB.Bson.Serialization.Attributes;

namespace SignalRTrial.Entities
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string Id { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string ProfilePicture { get; set; }
        public string Status { get; set; }
        public ICollection<string> Contacts { get; set; }
        public ICollection<string> GroupsIds { get; set; }

        public User()
        {
            Contacts = new HashSet<string>();
            GroupsIds = new HashSet<string>();
        }

        public User(string userName, string roomName) : this() //call the default constructor
        {
            UserName = userName;
            GroupsIds = new HashSet<string>();
        }
    }
}