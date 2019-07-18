var dhcpd = require('../lib/dhcp.js');

const server = dhcpd.createServer({
  // System settings
  /**
   * @param {IDHCPMessage} a 
   */
  range: function (a) {
    return [
      "10.0.0.139", "10.0.0.200"
    ]
  },
  forceOptions: ['hostname'], // Options that need to be sent, even if they were not requested
  randomIP: true, // Get random new IP from pool instead of keeping one ip
  static: {
    "11:22:33:44:55:66": "192.168.3.100"
  },

  // Option settings
  netmask: '255.255.255.0',
  router: [
    '10.0.0.138'
  ],
  timeServer: null,
  nameServer: null,
  dns: ["8.8.8.8", "8.8.4.4"],
  hostname: "kacknup",
  domainName: "xarg.org",
  broadcast: '10.0.0.255',
  server: '10.0.0.39', // This is us
  maxMessageSize: 1500,
  leaseTime: 86400,
  renewalTime: 60,
  rebindingTime: 120,
  bootFile: function (req, res) {
    // res.ip - the actual ip allocated for the client
    if (req.clientId === 'foo bar') {
      return 'x86linux.0';
    } else {
      return 'x64linux.0';
    }
  }
});

server.on('message', (data) => console.log(data));

server.on('bound', (state) => {
  console.log("BOUND:");
  console.log(state);
});

server.on("error", (err, data) => {
  console.log(err, data);
});

server.on("listening", (sock) => {
  var address = sock.address();
  console.info('Server Listening: ' + address.address + ':' + address.port);
});

server.on("close", () => {
  console.log('close');
});

server.listen();

process.on('SIGINT', () => {
  server.close();
});
