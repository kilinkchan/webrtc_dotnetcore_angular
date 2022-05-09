using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace web_webrtc.Service
{
    public class Message
    {
        public string SendClientId { get; set; }

        public string action { get; set; }

        public string msg { get; set; }

        public string nick { get; set; }
        public object offer { get; set; }
        public object answer { get; set; }
        public object candidate { get; set; }
        public string name { get; set; }
        public string Id { get; set; }
    }
}
