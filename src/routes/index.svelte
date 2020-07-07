<script>
	import {onMount } from 'svelte';
  import io from "socket.io-client";

  let dimi = 100; 
	let canvas;
	let fps = 10;
	let board_state = Array(66).fill(0).map(x => Array(66).fill(0));
	let lines = false;
	let cell_no = 50;
	let clear = false;
	let playing = false;
	let bollard_drops = 8;
	let score = 0;

	function flood_fill(b) {
		let queue = [[0,0]];
		let bollard_count = 0;

		do {
			let [x,y] = queue.pop();
		  let w = 0, e = b.length; 	
			for(e = x;e<=cell_no && b[e][y] != 1;++e){e = e}	
			for(w = x;w > 0 && b[w][y] != 1;w--){w = w}

			for(let c = w; c <e; c++) {
				if(b[c][y] == 2) bollard_count++;
				
				if((y - 1) >= 0 && b[c][y-1] != 1){
					queue.push([c,y-1]);
				}
				
				if((y + 1) < b.length && b[c][y+1] != 1){
					queue.push([c,y+1]);
				}
				
				b[c][y] = 1;
			}

		}while(queue.length > 0);

		return bollard_count;
	}


	const socket = io();
	
	socket.on('whoami', function(msg) {
		lines = msg;
	});

	socket.on('update_board',(u) => {
		u.forEach(([x,y,v]) => board_state[x][y] = v);
	});


	socket.on('start',(x) => {
		cell_no = x;
		clear = true;
		playing = true;
		board_state = Array(66).fill(0).map(x => Array(66).fill(0));
	});

	function count_bollards(b) {
		let c = 0;
		for(let x=0;x <b.length;++x) {
			for(let y=0;y <b[x].length;++y) {
				if(b[x][y] == 2) c++;

			}
		}
		return c;
	}


	socket.on('stop',(reason)=> {
		if (lines) {
			if(reason == 1) {
				score += 0;
			}else {
				let mid = count_bollards(board_state);
				mid += (mid % 2);
				
				let split = flood_fill(board_state);
				let t = Math.abs(split - (mid - split))
				score += 8 - t;
			}
		}
		lines = !lines;
		playing = false;
		bollard_drops = 8;
	});
	
	$: grid = Math.floor(dimi / cell_no) ;
	$: dim = grid * cell_no;
	$: scale = (cell) => grid * (cell - 1);
	$: socket.emit('change_loop_speed',fps);
  $: socket.emit('change_dimension',cell_no);

	function b_allowed(x,y) {
		
		return board_state[x][y] == 0;

	}

	function handle_click(e) {
		var rect = canvas.getBoundingClientRect();
		const x = 1+Math.floor((e.clientX - rect.left) / grid);
    const y = 1+Math.floor((e.clientY - rect.top) / grid);
		
		if(!lines && b_allowed(x,y) && bollard_drops > 0){
			socket.emit('place_bollard',x,y);
			--bollard_drops;
		}
		
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
<p> Control Chess</p>
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

<p> Score: {score} </p>

</controlarea>


<canvas
	bind:this={canvas}
	width={dim}
	height={dim}
	on:click={handle_click}
></canvas>

</main>
