import sirv from 'sirv';
import polka from 'polka';
import compression from 'compression';
import * as sapper from '@sapper/server';
import http from 'http';
import sock from 'socket.io';

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

const max_dim = 64 + 2;
let who = 0;
let loop_hande;
let board_state = Array(max_dim).fill(0).map(x => Array(max_dim).fill(0));
let head_x = 1,head_y = 1,h_dx = 1,h_dy = 0;
let board_dim = 50;


function update_board(u) {
	const f = u.filter(([x,y,v]) => board_state[x][y] == 0 || board_state[x][y] == 3); 

	f.forEach(([x,y,v]) => {board_state[x][y] = v;});
	io.emit('update_board',f);
}

function main_loop() {
		

	const nx = head_x + h_dx;
	const ny = head_y + h_dy;
	
	if(head_x > board_dim || 
		head_y > board_dim ||
		head_x < 1 || 
		head_y < 1) {
		clearInterval(loop_hande);
		// Edge of board
		// game over

	}else if(board_state[nx][ny] == 1) {
		// game over
		clearInterval(loop_hande);
	}else if(board_state[nx][ny] == 2) {
		let dir = Math.random() < 0.5 ? -1 : 1;
		let tx = h_dx*dir;
		let ty = h_dy*dir;
		
		h_dx = ty;
		h_dy = tx;
		
		head_x += h_dx;
		head_y += h_dy;
		update_board([[head_x,head_y,1]]);
	}else {
		head_x = nx;
		head_y = ny;
		update_board([[nx,ny,1]]);
	}
}


function change_direction(e) {
	// left arrow key
	if (e === 37 && h_dx === 0) {
		if(board_state[head_x-1][head_y] != 2) {h_dx=-1;h_dy=0;}
	}
	// up arrow key
	else if (e === 38 && h_dy === 0) {
		if(board_state[head_x][head_y+1] != 2) {h_dx=0,h_dy=-1};
	}
	// right arrow key
	else if (e === 39 && h_dx === 0) {
		if(board_state[head_x+1][head_y] != 2) {h_dx=1,h_dy=0}
	}
	// down arrow key
	else if (e === 40 && h_dy === 0) {
		if(board_state[head_x][head_y+1] != 2) {h_dx=0;h_dy=1};
	}
}

io.on('connection', (socket) => {

	socket.emit('whoami', who == 0);
	who = (who + 1) % 2;

	socket.on('head',(dx,dy)=>{
		io.emit('update_head',dx,dy);
	});

	socket.on('place_bollard',(x,y)=> {
	  if(x>=0 && x<=board_dim && y >= 0 && y <=board_dim && board_state[x][y] == 0) {
			update_board([[x,y,2],[x+1,y+1,3],[x-1,y+1,3],[x+1,y-1,3],[x-1,y-1,3]]);
		}
	});

	socket.on('change_direction',change_direction);

	socket.on('start',() =>{
		io.emit('start');
		head_x = 1;head_y = 1;h_dx = 1;h_dy = 0;
		board_state = Array(max_dim).fill(0).map(x => Array(max_dim).fill(0));
		update_board([[head_x,head_y,1]]);
		loop_hande = setInterval(main_loop,200);
	});

	socket.on('stop',()=> {
		clearInterval(loop_hande);
	});

	socket.on('change_loop_speed',(s) => {
		clearInterval(loop_hande);
    loop_hande = setInterval(socket.emit('loop'),1/s);
	});

	socket.on('disconnect', function() {
		clearInterval(loop_hande);
  });


});


