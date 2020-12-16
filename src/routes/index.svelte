<script>
	import {onMount, onDestroy } from 'svelte';
  import io from "socket.io-client";
	import {board_dim,fps,co_line,co_chess,co_nochess,max_rounds,chess_drops} from '../game_constants.js'
	import Dpad from '../components/Dpad.svelte'
	
	let canvas;
	let board_state = Array(board_dim+2).fill(0).map(()=>new Uint8Array(board_dim+2));
	let control_line = false;
	let playing = false;
	let score = 0;
	let opponent_score = 0;
	let round = 1;
	let dim = 1;
	$:cell_size = dim / board_dim; // size in pixels of grid square

	function flood_fill(board) {
		let queue = [[0,0]];
		let chess_count = 0;

		do {
			let [x,y] = queue.pop();
		  let west = x, east = x; 	
			for(;east<=board_dim && board[east][y] != 1;++east){}
			for(;west > 0 && board[west][y] != 1;--west){}

			for(let c = west ; c < east; c++) {
				if(board[c][y] == co_chess) chess_count++;
				
				if((y - 1) >= 0 && board[c][y-1] != 1){
					queue.push([c,y-1]);
				}
				
				if((y + 1) <= board_dim && board[c][y+1] != 1){
					queue.push([c,y+1]);
				}
				
				board[c][y] = 1;
			}

		}while(queue.length > 0);

		return chess_count;
	}

	let socket;
	
	function count_chesss(board) {
		let c = 0;
		for(let x=0;x <board.length;++x) {
			for(let y=0;y <board[x].length;++y) {
				if(board[x][y] == co_chess) c++;

			}
		}
		return c;
	}


	

	
	function chess_drop_allowed(x,y) {

		return board_state[x][y] == 0

	}

	function handle_click(e) {
		const rect = canvas.getBoundingClientRect();
		const x = 1+ Math.floor((e.clientX - rect.left - canvas.clientLeft) / cell_size);
		const y = 1+Math.floor((e.clientY - rect.top - canvas.clientTop) / cell_size);
		if(playing && !control_line && chess_drop_allowed(x,y) && chess_drops > 0){
			socket.emit('place_chess',x,y);

			[[x,y,co_chess],[x+1,y+1,co_nochess],[x-1,y+1,co_nochess],[x+1,y-1,co_nochess],[x-1,y-1,co_nochess]].forEach(([x,y,v]) => board_state[x][y] = v);
		}
		
	}

	let dpad_direction = 0;

	$:if(dpad_direction !== 0) {
		playing && socket.emit('change_direction',dpad_direction);
	}

	function handle_start() {
		opponent !== 'Waiting...' && socket.emit('start');
	}

	onMount(() => {
	
	socket = io();	
	
	socket.on('update_board',(u) => {
		// A bit hacky
		if(!playing) board_state = Array(board_dim+2).fill(0).map(()=>new Uint8Array(board_dim+2));
		
		u.forEach(([x,y,v]) => board_state[x][y] = v);
	});


	socket.on('start',() => {
		canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
		playing = true;
	});
	
	socket.on('stop',(reason)=> {
		
		if(reason != co_line) {
					
			let total = count_chesss(board_state); //total number of chesss
			
			let split = flood_fill(board_state); //number of chesss on the coloured side
			const round_score = Math.min(split,total-split);
			
			if (!control_line) {
				score += round_score;
				console.log("Your Score this Round:",round_score);
			} else {
				opponent_score += round_score;
				console.log("Opponent's Score this Round:",round_score);
			}
		}
		
		if(round ==5)
		{
			console.log("Your total score: "+score+". Opponent's total score: "+ opponent_score) // to be shown in a modal
		} else {
			round++
		}
		
		control_line = !control_line;
		playing = false;
	});
	
	socket.on('opponent', (opp) => {
		control_line = true;
		opponent = opp;
	});

	socket.on('current_games',(games) => {
		current_games = [...games];
	});

	socket.on('quit',(games)=> {
		playing = false;
		current_games = [...games];
		opponent = 'Waiting...';
		selected = false;
	});
	
	var context = canvas.getContext('2d');
	  		// game loop
		function loop() {
			requestAnimationFrame(loop);

			for(let x = 1; x <= board_dim; ++x) {
				for(let y = 1; y <= board_dim; ++y) {
					if(board_state[x][y] == 1) {
						context.fillStyle = 'green';
						context.fillRect((x-1)*cell_size, (y-1)*cell_size, cell_size-2, cell_size-2);  
					}
					
					else if(board_state[x][y] == 2) {
						context.fillStyle = 'red';
						context.fillRect((x-1)*cell_size, (y-1)*cell_size, cell_size, cell_size);  
					}

					else if(board_state[x][y] == 3) {
						context.fillStyle = 'pink';
						context.fillRect((x-1)*cell_size, (y-1)*cell_size, cell_size-1, cell_size-1);  
					}else {
						//context.fillStyle = "#00000002";
						//			context.fillRect((x-1)*cell_size, (y-1)*cell_size, cell_size, cell_size);  

					}

				}
			}
		}

		requestAnimationFrame(loop);
	});

	onDestroy(() => {
		socket = undefined;
	});



	let selected;
	const i_text = "Enter name here...";
	let playername=	i_text;
	let current_games = [];
	let opponent = "Waiting...";


	$: if (selected && socket) {
		if(opponent === 'Waiting...') socket.emit('select_game',selected,playername);
		if(selected !== 'new_game') opponent = selected;
	}

</script>

<style>
	
	main {
    margin: 0px;
    font-family: Arial, Helvetica, sans-serif;
    font-size:5vmin;
		display:flex;
		justify-content:space-evenly;
		flex-wrap: wrap;
    background-color:#1b212c;
		background-image: url(/white.svg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;     
    color:white;
    width:100%;
	}

	main >p {
		min-width:22vmin;
	}

	input { 
		text-align: center;
		width:48vmin;
		background: rgba(0, 0, 0, 0);
		color:white;
		border:0;
		font-size:5vmin;
	}

	label >select {
		display:block;
	}
	controlarea{
		display:grid;
		grid-auto-flow:row;
		justify-items: center;
		color:#fff;
		align-content:space-around;
	}
	
canvas{
		box-sizing: content-box;
		background-color: #00000000;
    height: 96vmin;
    width: 96vmin;
    border: 2vmin solid #1b212c;
}

button {
    font-size:2vmin;
    color:white;
    background-color: #82C7A5;
    cursor: pointer;
}
button:hover{
    background-color: #9BD2B7;
}
button:active{
    background-color: #689F84;
}


</style>

<main >
	<p on:click = "{()=> document.querySelector('main').requestFullscreen()
}"> Round: {round} </p>


<canvas
	bind:this={canvas}
	width={dim}
	height={dim}
	on:click={e => handle_click(e)}
	bind:clientWidth={dim}
></canvas>

<controlarea>
	<input maxlength="10" bind:value={playername} readonly={selected} on:click={(e)=> e.target.value = ''}>
	
{#if playername !== i_text}

	{#if opponent !== 'Waiting...'}
		{#if control_line}
			<Dpad bind:direction={dpad_direction} />
			<p> Control Line</p>
		{:else}
			<p> Control Chess</p>
		{/if}
	
		<button on:click={handle_start}>
		  Start
		</button>
	{/if}
	
	{#if !selected }		
		<label for="room">Select Game

		<select name="room" bind:value={selected}>
			<option disabled selected value>Select Game</option>
			<option value="new_game">New Game</option>
			
			{#each current_games as game }
				<option value={game}>{game}</option>
			{/each}
		</select>
		</label>	
	{:else if selected === 'new_game'}
		<p>Opponent: {opponent} </p>
	{:else}
		<p>Opponent: {selected} </p>
	{/if}

{/if}
</controlarea>
</main>
