const dgram = require('dgram');
var sock = dgram.createSocket('udp4');
var foo = "blabla";
sock.send(foo, 0, foo.length, 2001, "0.0.0.0", (err, bytes) => {
	console.log(err, bytes);
});

