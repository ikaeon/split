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
	let opponent_score = 0;
	let round = 1;

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
				
				if((y + 1) <= cell_no && b[c][y+1] != 1){
					queue.push([c,y+1]);
				}
				
				b[c][y] = 1;
			}

		}while(queue.length > 0);

		return bollard_count;
	}


	const socket = io();
	
	socket.on('whoami', function(msg,x,f) {
		lines = msg;
		cell_no = x;
		fps = f;
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
		let round_score=0;
		let round_opponent_score=0;
		if(reason == 1) {
			score += 0;
		} else {
			let total = count_bollards(board_state); //total number of bollards
			//mid += (total % 2);
			
			let split = flood_fill(board_state); //number of bollards on the coloured side
			//let t = Math.abs(split - (mid - split))
			if (!lines) {
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
		lines = !lines;
		playing = false;
		bollard_drops = 8;
	});
	
	$: grid = Math.floor(dimi / cell_no) ;
	$: dim = grid * cell_no;
	$: scale = (cell) => grid * (cell - 1);
	$: socket.emit('change_loop_speed',fps);
  $: socket.emit('change_dimension',cell_no);

	
	socket.on('change_dimension',(x) => {
		cell_no = x;
	
	});

	let one_sec = true;
	function b_allowed(x,y) {

		return board_state[x][y] == 0 //&& one_sec;

	}

	function handle_click(e) {
		var rect = canvas.getBoundingClientRect();
		const x = 1+Math.floor((e.clientX - rect.left) / grid);
		const y = 1+Math.floor((e.clientY - rect.top) / grid);
		
		if(!lines && b_allowed(x,y) && bollard_drops > 0){
			socket.emit('place_bollard',x,y);
			//--bollard_drops;
			//one_sec = false;
			//setTimeout(() => one_sec = true, 1000);
		}
		
	}

	 function handle_keydown(e) {
		socket.emit('change_direction',e.which);
	}

	function dpad_direction(d) {
		socket.emit('change_direction',d);
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
main {justify-content:space-evenly;flex-wrap: wrap;}
</style>
<svelte:window on:keydown={handle_keydown}/>

<main>
<!--
<h1> SPLIT </h1>
-->

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
{#if lines}
<p> Control Line</p>
{:else}
<p> Control Chess</p>
{/if}<!--
<p>Grid/s:  {fps} </p>

<label>
	<input type=range bind:value={fps} min=1 max=64 onkeydown="return false">
</label>

<p>Dimensions: {cell_no}   </p>

<label>
	<input type=range bind:value={cell_no} min=8 max=64 onkeydown="return false">
</label>
-->
{#if lines}
  <nav class="d-pad">
    <a class="up" href="#" on:click={() => dpad_direction(38)}></a>
    <a class="right" href="#" on:click={() => dpad_direction(39)}></a>
    <a class="down" href="#" on:click={() => dpad_direction(40)}></a>
    <a class="left" href="#" on:click={() => dpad_direction(37)}></a>  
  </nav>
{/if}

{#if playing}
<button on:click={handle_stop}>
    Stop
</button>
{:else}
<button on:click={handle_start}>
    Start
</button>
{/if}
<!--
<p> Score: {score} </p>
-->
</controlarea>
</main>
