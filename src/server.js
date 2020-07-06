import sirv from 'sirv';
import polka from 'polka';
import compression from 'compression';
import * as sapper from '@sapper/server';
import http from 'http';
import sock from 'socket.io';
import worker from 'worker_threads';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';
const server = http.createServer();

polka({server}) // You can also use Express
	.use(
		compression({ threshold: 0 }),
		sirv('static', { dev }),
		sapper.middleware()
	)
	.listen(PORT, err => {
		if (err) console.log('error', err);
	});

const io = sock(server);

let who = 0;

let h = new worker.Worker('./test.js');


io.on('connection', (socket) => {

	socket.emit('whoami', who == 0);
	who = (who + 1) % 2;
//  setInterval(()=>socket.emit('loop'),1);


});


