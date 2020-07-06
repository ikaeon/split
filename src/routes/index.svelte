<script>
	import {onMount } from 'svelte';
  import io from "socket.io-client";

  let dimi = 100; 
	let canvas;
	let fps = 20;
	let board_state = Array(66).fill(0).map(x => Array(66).fill(0));
	let lines = false;
	let cell_no = 50;
	let clear = false;
	let playing = false;


	const socket = io();
	
	socket.on('whoami', function(msg) {
		lines = msg;
	});

	socket.on('update_board',(u) => {
		u.forEach(([x,y,v]) => board_state[x][y] = v);
	});


	socket.on('start',() => {
		clear = true;
		playing = true;
		board_state = Array(66).fill(0).map(x => Array(66).fill(0));
	});
	
	$: grid = Math.floor(dimi / cell_no) ;
	$: dim = grid * cell_no;
	$: scale = (cell) => grid * (cell - 1);

	function b_allowed(x,y) {
		
		return board_state[x][y] == 0;

	}

	function handle_click(e) {
		var rect = canvas.getBoundingClientRect();
		const x = 1+Math.floor((e.clientX - rect.left) / grid);
    const y = 1+Math.floor((e.clientY - rect.top) / grid);
		if(b_allowed(x,y)) socket.emit('place_bollard',x,y);
		
	}

	 function handle_keydown(e) {
		socket.emit('change_direction',e.which);
	}

	function handle_start() {
		socket.emit('start');
	}

	function handle_stop() {
		socket.emit('stop');
		playing = false;
	}

	onMount(() => {
		
		dimi = Math.min(canvas.parentElement.clientHeight,
						canvas.parentElement.clientWidth) - 2;

		var context = canvas.getContext('2d');


		// game loop
		function loop() {
			requestAnimationFrame(loop);
			if(clear) {
				context.clearRect(0,0,canvas.width,canvas.height);
				clear = false;
			}

			for(let x = 1; x <= cell_no; ++x) {
				for(let y = 1; y <= cell_no; ++y) {
					if(board_state[x][y] == 1) {
						context.fillStyle = 'green';
						context.fillRect(scale(x), scale(y), grid-1, grid-1);  
					}
					
					else if(board_state[x][y] == 2) {
						context.fillStyle = 'red';
						context.fillRect(scale(x), scale(y), grid, grid);  
					}

					else if(board_state[x][y] == 3) {
						context.fillStyle = 'pink';
						context.fillRect(scale(x), scale(y), grid-1, grid-1);  
					}

				}
			}
		}

		requestAnimationFrame(loop);
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
		width:200px;
					
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
{#if lines}
<p> Control Line</p>
{:else}
<p> Conrol Chess</p>
{/if}
<p>Grid/s:  {fps} </p>

<label>
	<input type=range bind:value={fps} min=1 max=64 onkeydown="return false">
</label>

<p>Dimensions: {cell_no}   </p>

<label>
	<input type=range bind:value={cell_no} min=8 max=64 onkeydown="return false">
</label>

{#if playing}
<button on:click={handle_stop}>
    Stop
</button>
{:else}
<button on:click={handle_start}>
    Start
</button>
{/if}


</controlarea>


<canvas
	bind:this={canvas}
	width={dim}
	height={dim}
	on:click={handle_click}
></canvas>

</main>
