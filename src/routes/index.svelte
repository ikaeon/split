<script>
	import {onMount } from 'svelte';
  import io from "socket.io-client";

  let dimi = 100; 
	let canvas;
	let handle_keydown;
	let fps = 50;
	let cell_no= 50;
	let board_state = Array(cell_no).fill(0).map(x => Array(cell_no).fill(0));
	let head_x = 0;
	let head_y = 25;
	let head_dx = 1;
	let head_dy = 0;
	
	let lines = false;

	const socket = io();
	
	socket.on('whoami', function(msg) {
		console.log("heheh",msg);
		lines = msg;
	});


	$: grid = Math.floor(dimi / cell_no) ;
	$: dim = grid * cell_no;
	$: scale = (cell) => grid * cell;
  
	onMount(() => {
		
		dimi = Math.min(canvas.parentElement.clientHeight,
						canvas.parentElement.clientWidth) - 2;

		var context = canvas.getContext('2d');

		var count = 0;

		var snake = {
			x: 0,
			y: Math.floor(dimi / 2),
			
			// snake velocity. moves one grid length every frame in either the x or y direction
			dx: grid,
			dy: 0,
			
			// keep track of all grids the snake body occupies
			cells: [],
			
			// length of the snake. grows when eating an apple
			maxCells: 4
		};
		
		var apple = {
			x: scale(Math.floor(cell_no / 2)),
			y: scale(Math.floor(cell_no / 2))
		};

		// get random whole numbers in a specific range
		// @see https://stackoverflow.com/a/1527820/2124254
		function getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min)) + min;
		}

		handle_keydown = function(e) {
			// prevent snake from backtracking on itself by checking that it's 
			// not already moving on the same axis (pressing left while moving
			// left won't do anything, and pressing right while moving left
			// shouldn't let you collide with your own body)
			// left arrow key
			if (e.which === 37 && head_dx === 0) {
				head_dx = -1;
				head_dy = 0;
			}
			// up arrow key
			else if (e.which === 38 && head_dy === 0) {
				head_dx = 0;
				head_dy = -1;
			}
			// right arrow key
			else if (e.which === 39 && head_dx === 0) {
				head_dx = 1;
				head_dy = 0;
			}
			// down arrow key
			else if (e.which === 40 && head_dy === 0) {
				head_dx = 0;
				head_dy = 1;
			}
		}
		socket.on('loop',()=> loop());
		// game loop
		function loop() {
			//requestAnimationFrame(loop);
		
			// slow game loop to 15 fps instead of 60 (60/15 = 4)
			if (++count < (61 - fps)) {
				return;
			}

			count = 0;
//			context.clearRect(0,0,canvas.width,canvas.height);
			
			for(let x = 0; x < cell_no; ++x) {
				for(let y = 0; y < cell_no; ++y) {
					if(board_state[x][y] == 1) {
						context.fillStyle = 'green';
						context.fillRect(scale(x), scale(y), grid-1, grid-1);  
					}
					
					if(board_state[x][y] == 2) {
						context.fillStyle = 'red';
						context.fillRect(scale(x), scale(y), grid, grid);  
					}

				}
			}


			// move snake by it's velocity
			head_x += head_dx;
			head_y += head_dy;
			
			if(head_x >= cell_no || head_y >= cell_no) {
				//round over
			}else if(board_state[head_x][head_y] == 1) {
				//round over
			}else if(board_state[head_x][head_y] == 2) {
				let dir = Math.random() < 0.5 ? -1 : 1;
				let tx = head_dx*dir;
				let ty = head_dy*dir;
				
				head_x -= head_dx;
				head_y -= head_dy;
				head_dx = ty;
				head_dy = tx;
				
				head_x += head_dx;
				head_y += head_dy;
			
				board_state[head_x][head_y] = 1;
			}else {
				board_state[head_x][head_y] = 1;
			}

			// draw apple
			loop: do {
				let x = getRandomInt(0,cell_no);
				let y = getRandomInt(0,cell_no);

				if (board_state[x][y] != 0) continue loop;
				board_state[x][y] = 2; 
			} while(0);
		}

		//requestAnimationFrame(loop);
	});


</script>

<style>
	main {
		display:grid;
		grid-template-columns: auto auto 100vmin ;
		grid-template-areas:"c a b";
		height:100%;
	}
  
	h1 {
		grid-area:c;
		background-color:black;
		color:white;
		font-size:64px;
		writing-mode: vertical-rl;
		text-orientation: upright;
		margin: 0 auto;
	}

	controlarea {
		grid-area:a;
		display:flex;
		flex-direction:column;
		justify-content: stretch;
		align-content: center;
		height:100%;
					
	}

	canvas {
		grid-area:b;		
    border: 1px solid black;
  }

</style>

<svelte:window on:keydown={handle_keydown}/>

<main>

<h1> SPLIT </h1>


<controlarea>
<p>Snake Speed: {fps} </p>

<label>
	<input type=range bind:value={fps} min=1 max=60 onkeydown="return false">
</label>

<p>Dimensions: {cell_no}   </p>

<label>
	<input type=range bind:value={cell_no} min=8 max=64 onkeydown="return false">
</label>


</controlarea>


<canvas
	bind:this={canvas}
	width={dim}
	height={dim}
></canvas>

</main>
