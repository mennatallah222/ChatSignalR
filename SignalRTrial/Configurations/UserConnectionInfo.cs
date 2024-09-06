namespace SignalRTrial.Configurations
{
    public class UserConnectionInfo
    {
        public string UserId { get; set; } = string.Empty;
        public string ConnectionId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;

        public List<string> GroupIds { get; set; } = new List<string>();
    }
}
