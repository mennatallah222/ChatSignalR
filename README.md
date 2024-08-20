# WhatasApp Clone Chat Application
This project is a real-time chat application built using .NET 8, SignalR for real-time communication, JavaScript as the client library, and MongoDB as the database. The application allows users to create and join chat rooms, send messages, and receive real-time notifications.

# Features
Real-time Communication: Leverages SignalR for real-time messaging between clients.
Chat Rooms: Users can create and join multiple chat rooms.
Persistent Messaging: Messages are stored in MongoDB, ensuring they are available even after users leave and rejoin a room.
User Authentication: Secure user authentication and session management.
Notifications: Real-time notifications for new messages and updates.
Responsive Design: User-friendly interface, optimized for various devices.

# Tech Stack
Backend:
.NET 8: Latest version of .NET, providing robust and scalable backend services.
SignalR: Library for adding real-time web functionality to applications.
MongoDB: NoSQL database for storing chat messages and user data.

Frontend:
JavaScript: Used with HTML and CSS for the client-side interface.
SignalR Client Library: JavaScript library for connecting to SignalR hubs and managing real-time communication.

# Prerequisites
.NET 8 SDK
Node.js (for frontend dependencies)
MongoDB (local or cloud-based)
# Installation
Clone the repository:

git clone https://github.com/yourusername/chat-app.git
cd chat-app

Install backend dependencies:

dotnet restore
Install frontend dependencies:

Set up MongoDB:

Ensure MongoDB is running.
Configure the MongoDB connection string in the appsettings.json file.
Run the application:

dotnet run
Open the application:

Navigate to http://localhost:5000 in your web browser.
# Usage
Sign Up / Log In: Users can register and log in to the chat application.
Create/Join Chat Rooms: Users can create new chat rooms or join existing ones.
Send Messages: Users can send and receive real-time messages within a chat room.
Notifications: Get notified when a new message arrives in a chat room you have joined.
# Project Structure
/ClientApp: Contains the frontend code including HTML, CSS, and JavaScript.
/Controllers: API controllers for managing user authentication and chat functionalities.
/Hubs: SignalR hubs for managing real-time communication.
/Models: MongoDB schemas and models.
/Services: Business logic for managing chat rooms, messages, and user sessions.
Contributing
Contributions are welcome! Please fork the repository and submit a pull request.
