<script>
	import {onMount } from 'svelte';
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




	let dim; // dimensions of canvas; cell_size * board_dim
	let cell_size; // size in pixels of grid square

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

	const socket = io();
	
	socket.on('update_board',(u) => {
		// A bit hacky
		if(!playing) board_state = Array(board_dim+2).fill(0).map(()=>new Uint8Array(board_dim+2));
		u.forEach(([x,y,v]) => board_state[x][y] = v);
	});


	socket.on('start',() => {
		playing = true;
	});
	
	function count_chesss(board) {
		let c = 0;
		for(let x=0;x <board.length;++x) {
			for(let y=0;y <board[x].length;++y) {
				if(board[x][y] == co_chess) c++;

			}
		}
		return c;
	}


	socket.on('stop',(reason)=> {
		let round_score=0;
		let round_opponent_score=0;
		if(reason == co_line) {
			score += 0;
		} else {
			let total = count_chesss(board_state); //total number of chesss
			//mid += (total % 2);
			
			let split = flood_fill(board_state); //number of chesss on the coloured side
			//let t = Math.abs(split - (mid - split))
			if (!control_line) {
				//score += 8 - t;
				round_score = Math.min(split,total-split);
				score += round_score;
			} else {
				//opponent_score += 8 - t; //calculation of opponent score
				round_opponent_score= Math.min(split,total-split);
				opponent_score += round_opponent_score;
			}
		}
		console.log("For this round, your score: "+round_score+"; opponent's score: "+ round_opponent_score) // to be shown in a modal
		if(round ==5)
		{
			console.log("Your total score: "+score+". Opponent's total score: "+ opponent_score) // to be shown in a modal
		} else {
			round++
		}
		
		control_line = !control_line;
		playing = false;
	});
	

	
	function chess_drop_allowed(x,y) {

		return board_state[x][y] == 0

	}

	function handle_click(e) {
		const rect = canvas.getBoundingClientRect();
		const x = 1+Math.floor((e.clientX - rect.left) / cell_size);
		const y = 1+Math.floor((e.clientY - rect.top) / cell_size);
		
		if(!control_line && chess_drop_allowed(x,y) && chess_drops > 0){
			socket.emit('place_chess',x,y);

			[[x,y,co_chess],[x+1,y+1,co_nochess],[x-1,y+1,co_nochess],[x+1,y-1,co_nochess],[x-1,y-1,co_nochess]].forEach(([x,y,v]) => board_state[x][y] = v);
		}
		
	}

	let dpad_direction = 0;

	$:if(dpad_direction !== 0) {
		socket.emit('change_direction',dpad_direction);
	}

	function handle_start() {
		if(opponent !== 'Waiting...') socket.emit('start');
	}

	function handle_stop() {
		socket.emit('stop');
	}

	onMount(() => {
		
		cell_size = Math.floor((Math.min(canvas.parentElement.clientHeight, canvas.parentElement.clientWidth) - 2) / board_dim);
		dim = cell_size*board_dim;

		var context = canvas.getContext('2d');


		// game loop
		function loop() {
			requestAnimationFrame(loop);

			for(let x = 1; x <= board_dim; ++x) {
				for(let y = 1; y <= board_dim; ++y) {
					if(board_state[x][y] == 1) {
						context.fillStyle = 'green';
						context.fillRect((x-1)*cell_size, (y-1)*cell_size, cell_size-1, cell_size-1);  
					}
					
					else if(board_state[x][y] == 2) {
						context.fillStyle = 'red';
						context.fillRect((x-1)*cell_size, (y-1)*cell_size, cell_size, cell_size);  
					}

					else if(board_state[x][y] == 3) {
						context.fillStyle = 'pink';
						context.fillRect((x-1)*cell_size, (y-1)*cell_size, cell_size-1, cell_size-1);  
					}else {
						context.fillStyle = 'white';
						context.fillRect((x-1)*cell_size, (y-1)*cell_size, cell_size, cell_size);  

					}

				}
			}
		}

		requestAnimationFrame(loop);
	});

	let selected;
	let playername="Enter name here...";
	let current_games = [];
	let opponent = "Waiting...";

	socket.on('opponent', (opp) => {
		control_line = true;
		opponent = opp;
	});

	socket.on('current_games',(games) => {
		current_games = [...games];
	});

	socket.on('quit',()=> {
		opponent = 'Waiting...';
		selected = 'new_game'; 
	});

	$: if (selected) {
		if(opponent === 'Waiting...') socket.emit('select_game',selected,playername);
		if(selected !== 'new_game') opponent = selected;
	}

</script>

<style>
	
	main {justify-content:space-evenly;flex-wrap: wrap;}
	input { 
		background: rgba(0, 0, 0, 0);
		font-size:32px;
		color:white;
		border:0;
	}

</style>

<main>
<sub> Round: {round} </sub>
<svg version="1.1" id="settings" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 32 32" style="enable-background:new 0 0 32 32;" xml:space="preserve">
       <path class="st0" d="M31,18v-4h-3.2c-0.3-1.8-1-3.5-2-4.9L28,6.8L25.2,4L23,6.2c-1.5-1-3.2-1.7-5-2V1h-4v3.2c-1.8,0.3-3.5,1-4.9,2
               L6.8,4L4,6.8L6.2,9c-1,1.5-1.7,3.2-2,4.9H1v4h3.2c0.3,1.8,1,3.5,2,5L4,25.2L6.8,28L9,25.7c1.5,1,3.2,1.7,4.9,2V31h4v-3.2
               c1.8-0.3,3.5-1,5-2l2.2,2.2l2.8-2.8l-2.3-2.3c1-1.5,1.7-3.2,2-4.9H31z M16,21c-2.8,0-5-2.2-5-5s2.2-5,5-5s5,2.2,5,5S18.8,21,16,21z
               "/>
</svg>


<canvas
	bind:this={canvas}
	width={dim}
	height={dim}
	on:click={handle_click}
></canvas>
<controlarea>
	<input bind:value={playername} readonly={selected}>

	{#if !selected }
	 <p>Select Game</p>

	<select bind:value={selected}>
		<option disabled selected value>Select Game</option>
		<option value="new_game">New Game</option>
		{#each current_games as game }
			<option value={game}>{game}</option>
		{/each}
	</select>
	{:else if selected === 'new_game'}
		<p>Opponent: {opponent} </p>
	{:else}
	<p>Opponent: {selected} </p>

{/if}


	{#if control_line}
<p> Control Line</p>
{:else}
<p> Control Chess</p>
{/if}

{#if control_line}
<Dpad bind:direction={dpad_direction} />
{/if}
{#if opponent !== 'Waiting...'}
{#if playing }
<button on:click={handle_stop}>
    Stop
</button>
{:else}
<button on:click={handle_start}>
    Start
</button>
{/if}
{/if}
	</controlarea>
	</main>
