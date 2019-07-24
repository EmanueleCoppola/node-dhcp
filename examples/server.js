// @ts-check

const { OptionId, createServer, LeaseLiveStoreFile, LeaseStaticStoreMemory, LeaseOfferStoreMemory} = require('../lib/dhcp.js');

const leaseOffer = new LeaseOfferStoreMemory();
const leaseLive = new LeaseLiveStoreFile('leases.json');
const leaseStatic = new LeaseStaticStoreMemory({
  "11:22:33:44:55:66": "192.168.3.100"
});

const server = createServer(/** @type {IServerConfig} */ {
  // System settings
  range: function (a) {
    return [
      "10.0.0.139", "10.0.0.200"
    ]
  },
  forceOptions: ['hostname'], // Options that need to be sent, even if they were not requested
  randomIP: true, // Get random new IP from pool instead of keeping one ip
  leaseOffer,
  leaseLive,
  leaseStatic,
  // Option settings
  [OptionId.netmask]: '255.255.255.0',
  [OptionId.router]: [
    '10.0.0.138'
  ],
  [OptionId.timeServer]: null,
  [OptionId.nameServer]: null,
  [OptionId.dns]: ["8.8.8.8", "8.8.4.4"],
  [OptionId.hostname]: "kacknup",
  [OptionId.domainName]: "xarg.org",
  [OptionId.broadcast]: '10.0.0.255',
  [OptionId.server]: '10.0.0.39', // This is us
  [OptionId.maxMessageSize]: 1500,
  [OptionId.leaseTime]: 86400,
  [OptionId.renewalTime]: 60,
  [OptionId.rebindingTime]: 120,
  [OptionId.bootFile]: function (req, res) {
    // res.ip - the actual ip allocated for the client
    if (req.clientId === 'foo bar') {
      return 'x86linux.0';
    } else {
      return 'x64linux.0';
    }
  }
});

server.on('message', (data) => console.log(data));

server.on('bound', (state) => console.log("BOUND:", state));

server.on("error", (err, data) => console.log(err, data));

server.on("listening", (sock) => {
  const address = sock.address();
  console.info(`Server Listening: ${address.address}:${address.port}`);
});

server.on("close", () => console.log('server closed'));

server.listen();

process.on('SIGINT', () => server.close());
