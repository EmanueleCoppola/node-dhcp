const dhcp = require('../lib/dhcp.js');

const s = dhcp.createClient();
s.on('message', (data) => console.log(data));
s.on('error', (err, data) => console.log(err, data));
s.on('listening', (sock) => {
  var address = sock.address();
  console.info('Client Listening: ' + address.address + ':' + address.port);
});

s.on('bound', (state) => {
  console.log("State: ", state);
  // `ip address add IP/MASK dev eth0`
  // `echo HOSTNAME > /etc/hostname && hostname HOSTNAME`
  // `ip route add default via 192.168.1.254`
  // `sysctl -w net.inet.ip.forwarding=1`
  s.close();
});

s.listen()
  .then(() => s.sendDiscover())
  .then((len) => console.log(`broadcast ${len} bytes`))


