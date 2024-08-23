using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SignalRTrial.Configurations;
using SignalRTrial.Hubs;
using SignalRTrial.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

//configuring mongodb settings from the json file
builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection(nameof(MongoDBSettings)));
builder.Services.AddSingleton<IMongoDBSettings>(sp => sp.GetRequiredService<IOptions<MongoDBSettings>>().Value);//there will only be one instance of IMongoDBSettings throughout the application’s lifetime //interface-based dependency injection

builder.Services.AddSingleton<IMongoClient>(s => new MongoClient(builder.Configuration.GetValue<string>("MongoDBSettings:ConnectionString")));// registers an instance of MongoClient with the DI container as a singleton, so the same instance of MongoClient is used throughout the application


//register the IMongoDatabase
builder.Services.AddScoped<IMongoDatabase>(s =>
{
    var client = s.GetRequiredService<IMongoClient>();
    var settings = s.GetRequiredService<IMongoDBSettings>();
    return client.GetDatabase(settings.DatabaseName);
});

builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<MessageService>();
builder.Services.AddScoped<GroupService>();

builder.Services.AddSignalR();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}



app.UseHttpsRedirection();

app.UseRouting();

app.UseAuthorization();




app.UseStaticFiles();
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
    endpoints.MapHub<ChatHub>("/chat");
});

app.Run();
