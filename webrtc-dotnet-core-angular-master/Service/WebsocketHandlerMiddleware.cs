using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Threading;

namespace web_webrtc.Service
{    
    public class WebsocketHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger _logger;
        public static List<Message> messagesList;

        public WebsocketHandlerMiddleware(
            RequestDelegate next,
            ILoggerFactory loggerFactory
            )
        {
            _next = next;
            _logger = loggerFactory.
                CreateLogger<WebsocketHandlerMiddleware>();
            messagesList = new List<Message>();
        }

        public async Task Invoke(HttpContext context)
        {
            if (context.Request.Path == "/ws")
            {
                Console.WriteLine("1111111111111111111111111111111111111");
                if (context.WebSockets.IsWebSocketRequest)
                {
                    WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
                    string clientId = Guid.NewGuid().ToString(); ;
                    var wsClient = new WebsocketClient
                    {
                        Id = clientId,
                        WebSocket = webSocket
                    };
                    try
                    {
                        await Handle(wsClient);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Echo websocket client {0} err .", clientId);
                        await context.Response.WriteAsync("closed");
                    }
                }
                else
                {
                    context.Response.StatusCode = 404;
                }
            }
            else
            {
                await _next(context);
            }
        }
        /*
        public static string ReadStringFromFile(string FilePath)
        {
            using (FileStream fs = new FileStream(FilePath, FileMode.Open))
            {

                byte[] byArray = new byte[fs.Length];

                fs.Read(byArray, 0, (int)fs.Length);

                return Encoding.UTF8.GetString(byArray).Replace("\n", "").Replace("\t", "").Replace("\r", "");
            }
        }
        */
        private async Task Handle(WebsocketClient webSocket)
        {
            WebsocketClientCollection.Add(webSocket);
            _logger.LogInformation($"Websocket client added.");
            for (int i = 0; i < WebsocketClientCollection.GetAllID().ToArray().Length; i++)
                Console.WriteLine(WebsocketClientCollection.GetAllID().ToArray()[i].Id);

            WebSocketReceiveResult result = null;
            do
            {
                var buffer = new byte[20000];
                result = await webSocket.WebSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (result.MessageType == WebSocketMessageType.Text && !result.CloseStatus.HasValue)
                {
                    var msgString = Encoding.UTF8.GetString(buffer);
                    _logger.LogInformation($"Websocket client ReceiveAsync message {msgString}.");
                    var message = JsonConvert.DeserializeObject<Message>(msgString);
                    message.SendClientId = webSocket.Id;
                    MessageRoute(message);
                }
            }
            while (!result.CloseStatus.HasValue);
            WebsocketClientCollection.Remove(webSocket);
            _logger.LogInformation($"Websocket client closed.");
        }

        private void MessageRoute(Message message)
        {
            var client = WebsocketClientCollection.Get(message.SendClientId);
            Console.WriteLine("[message]: "+message.action);
            switch (message.action)
            {
                case "login":
                    //client.RoomNo = message.msg;                    
                    Console.WriteLine("[name]: " + message.name);
                    Console.WriteLine("[name]: " + client.Id);
                    message.Id = client.Id;                    
                    messagesList.Add(message);
                    //client.SendMessageAsync($"{message.nick} join room {client.RoomNo} success .");
                    //client.SendMessageAsync($"{message.nick} join room {client.RoomNo} success .");
                    //_logger.LogInformation($"Websocket client {message.SendClientId} join room {client.RoomNo}.");
                    client.SendMessageAsync("{\"type\":\"login\",\"name\":\"" + message.name +"\", \"success\": \"true\", \"id\":\""+ client.Id + "\"}");
                    Console.WriteLine(message.ToString());
                    break;
                case "join":
                    client.RoomNo = message.msg;
                    client.SendMessageAsync($"{message.nick} join room {client.RoomNo} success .");
                    _logger.LogInformation($"Websocket client {message.SendClientId} join room {client.RoomNo}.");
                    break;
                case "send_to_room":
                    if (string.IsNullOrEmpty(client.RoomNo))
                    {
                        break;
                    }
                    var clients = WebsocketClientCollection.GetRoomClients(client.RoomNo);
                    clients.ForEach(c =>
                    {
                        c.SendMessageAsync(message.nick + " : " + message.msg);
                    });
                    _logger.LogInformation($"Websocket client {message.SendClientId} send message {message.msg} to room {client.RoomNo}");
                    break;
                case "offer":
                    Console.WriteLine("ooooooffffffeeeeerrrr!!!!");
                    //if (string.IsNullOrEmpty(client.RoomNo))
                    {
                        Console.WriteLine("offer: " + message.offer);
                        //break;
                    }
                    //WebsocketClientCollection.Get(message.SendClientId)
                    for (int i = 0; i < messagesList.ToArray().Length; i++)
                    {
                        if(messagesList.ToArray()[i].Id == client.Id)
                        {
                            Console.WriteLine("WebsocketClientCollection.GetAllID().ToArray()[i]: " + messagesList.ToArray()[i].name);
                        }
                    }

                    client.RoomNo = "8888";
                    //client.SendMessageAsync("{\"type\":\"offer\",\"offer\":"+ message.offer + " ,\"name\":\"" + message.name + "\", \"success\": \"true\", \"id\":\"" + client.Id + "\"}");
                    clients = WebsocketClientCollection.GetAllID();
                    clients.ForEach(c =>
                    {
                        if(client.Id != c.Id)
                            c.SendMessageAsync("{\"type\":\"offer\",\"offer\":" + message.offer + " ,\"name\":\"" + message.name + "\", \"success\": \"true\", \"id\":\"" + client.Id + "\"}");
                    });
                    _logger.LogInformation($"Websocket client {message.SendClientId} join room {client.RoomNo}.");

                    break;
                case "answer":
                    Console.WriteLine("answer!!!!");
                    //if (string.IsNullOrEmpty(client.RoomNo))
                    {
                        Console.WriteLine("answer: " + message.answer);
                        //break;
                    }
                    //WebsocketClientCollection.Get(message.SendClientId)
                    for (int i = 0; i < messagesList.ToArray().Length; i++)
                    {
                        if (messagesList.ToArray()[i].Id == client.Id)
                        {
                            Console.WriteLine("WebsocketClientCollection.GetAllID().ToArray()[i]: " + messagesList.ToArray()[i].name);
                        }
                    }

                    client.RoomNo = "8888";
                    //client.SendMessageAsync("{\"type\":\"offer\",\"offer\":"+ message.offer + " ,\"name\":\"" + message.name + "\", \"success\": \"true\", \"id\":\"" + client.Id + "\"}");
                    clients = WebsocketClientCollection.GetAllID();
                    clients.ForEach(c =>
                    {
                        if (client.Id != c.Id)
                            c.SendMessageAsync("{\"type\":\"answer\",\"answer\":" + message.answer + " ,\"name\":\"" + message.name + "\", \"success\": \"true\", \"id\":\"" + client.Id + "\"}");
                    });
                    break;
                case "candidate":
                    Console.WriteLine("candidate!!!!");
                    //if (string.IsNullOrEmpty(client.RoomNo))
                    {
                        Console.WriteLine("answer: " + message.answer);
                        //break;
                    }
                    //WebsocketClientCollection.Get(message.SendClientId)
                    for (int i = 0; i < messagesList.ToArray().Length; i++)
                    {
                        if (messagesList.ToArray()[i].Id == client.Id)
                        {
                            Console.WriteLine("WebsocketClientCollection.GetAllID().ToArray()[i]: " + messagesList.ToArray()[i].name);
                        }
                    }

                    client.RoomNo = "8888";
                    //client.SendMessageAsync("{\"type\":\"offer\",\"offer\":"+ message.offer + " ,\"name\":\"" + message.name + "\", \"success\": \"true\", \"id\":\"" + client.Id + "\"}");
                    clients = WebsocketClientCollection.GetAllID();
                    clients.ForEach(c =>
                    {
                        if (client.Id != c.Id) {
                            Console.WriteLine("[message.candidate]: " + message.candidate);
                            c.SendMessageAsync("{\"type\":\"candidate\",\"candidate\":" + message.candidate + " ,\"name\":\"" + message.name + "\", \"success\": \"true\", \"id\":\"" + client.Id + "\"}");
                        }
                    });
                    break;
                case "leave":
                    var roomNo = client.RoomNo;
                    client.RoomNo = "";
                    client.SendMessageAsync($"{message.nick} leave room {roomNo} success .");
                    _logger.LogInformation($"Websocket client {message.SendClientId} leave room {roomNo}");
                    break;                
                default:
                    break;
            }
        }
    }
}
