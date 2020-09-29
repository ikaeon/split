import sirv from 'sirv';
import polka from 'polka';
import compression from 'compression';
import * as sapper from '@sapper/server';
import http from 'http';
import sock from 'socket.io';
import {board_dim,fps,co_line,co_chess,co_nochess} from './game_constants.js'


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

function update_board(board,room,u) {
	const f = u.filter(([x,y]) => board[x][y] == 0 || board[x][y] == co_nochess); 

	f.forEach(([x,y,v]) => {board[x][y] = v;});
	
	io.to(room).emit('update_board',f);
}

function main_loop(game,room) {
		
	const [x,y] = game.head.position;
	const [dx,dy] = game.head.velocity;
	let board = game.board;
	const nx = x + dx;
	const ny = y + dy;
	
	if(x > board_dim || y > board_dim || x < 1 || y < 1) {
		
		update_board(game.board,room,[[x,y,co_line]]);
    io.to(room).emit('stop',0);
    return true;
		// Edge of board
		// game over

	}else if(board[nx][ny] == co_line) {
    // game over line intersection
    io.to(room).emit('stop',co_line);
		return true;
		
	}else if(board[nx][ny] == co_chess) {
		// Will hit chess
		const dir = Math.random() < 0.5 ? -1 : 1;
		const ndx = dy*dir;
		const ndy = dx*dir;
		
		game.head.position = [x+ndx,y+ndy];
		game.head.velocity = [ndx,ndy];
		update_board(board,room,[[x+ndx,y+ndy,co_line]]);
	}else {
		game.head.position = [nx,ny];
		update_board(board,room,[[nx,ny,co_line]]);
  }
  
  return false;
}



function change_direction(game,e) {
	
	const [x,y] = game.head.position;
	const [dx,dy] = game.head.velocity;
	const board = game.board;


	// left arrow key
	if (e === 37 && dx === 0) {
		if(board[x-1][y] != 2) game.head.velocity = [-1,0];
	}	
	// up arrow key
	else if (e === 38 && dy === 0) {
		if(board[x][y+1] != 2) game.head.velocity = [0,-1];
	}
	// right arrow key
	else if (e === 39 && dx === 0) {
		if(board[x+1][y] != 2) game.head.velocity = [1,0]
	}
	// down arrow key
	else if (e === 40 && dy === 0) {
		if(board[x][y+1] != 2) game.head.velocity = [0,1];
	}
}

const rooms = {};

io.on('connection', (socket) => {
	
	let game = {};
	let room = '';


	socket.emit('current_games',Object.keys(rooms));

	socket.on('select_game', (g_room,playername) => {
		
		if(g_room === undefined) {
			socket.disconnect(true);
			return;
		}

		if (playername === 'new_game') {
			playername = 'Nope'
		}

		if (g_room === 'new_game') {
			if (playername in rooms) playername +=  'B';
			
			room = playername;
			socket.join(room);
			rooms[room] = game;
			
		}else if (g_room in rooms){
			room = g_room;
			game = rooms[room];
			delete rooms[room];
			
			socket.join(room);
			socket.to(room).emit('opponent',playername);

		}else {
			socket.disconnect(true);
		}
	});

	socket.on('place_chess',(x,y)=> {

		if(game.loop_handle && x>=0 && x<=board_dim && y >= 0 && y <=board_dim && game.board[x][y] == 0) {
			update_board(game.board,room,[[x,y,co_chess],[x+1,y+1,co_nochess],[x-1,y+1,co_nochess],[x+1,y-1,co_nochess],[x-1,y-1,co_nochess]]);
		}
	});

	socket.on('change_direction',(e)=> !game.loop_handle || change_direction(game,e));

	socket.on('start',() => {
		
		if(game.loop_handle) return; // No starts while playing

		game.head = {position : [1, Math.floor((board_dim+2)/2)] , velocity : [1,0]};
		game.board = Array(board_dim+2).fill(0).map(() => new Uint8Array(board_dim + 2));
		game.loop_handle = 0;
    game.loop_count = 0;

		const [x,y] = game.head.position;
		update_board(game.board,room,[[x,y,1],[0,y,1]]);
		
		io.to(room).emit('start');


		game.loop_handle = setInterval(function () {
      game.loop_count += 1;
      if(main_loop.bind(null,game,room)) {
        clearInterval(game.loop_handle);
        delete game.loop_handle;
        clearInterval(this);
        game.loop_count = 0;
      }

      if(game.loop_count > board_dim*board_dim) {
        clearInterval(game.loop_handle);
        delete game.loop_handle;
        clearInterval(this);
        game.loop_count = 0;
        console.log("setInverval leak caught");
      }
    
    },fps);
	});


	socket.on('disconnect', function() {
    if(game.loop_handle) {
      clearInterval(game.loop_handle);
      delete game.loop_handle;
    }

    if(rooms[room]) {
      delete rooms[room];
    }
    
    io.to(room).emit('quit',Object.keys(rooms));
		
  });

});

