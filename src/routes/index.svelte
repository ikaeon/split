<script>
	import {onMount } from 'svelte';

	let canvas;
	let handle_keydown;
	let fps = 1;
	
	onMount(() => {

		var context = canvas.getContext('2d');

		var grid = 16;
		var count = 0;
			
		var snake = {
			x: 0,
			y: 400,
			
			// snake velocity. moves one grid length every frame in either the x or y direction
			dx: grid,
			dy: 0,
			
			// keep track of all grids the snake body occupies
			cells: [],
			
			// length of the snake. grows when eating an apple
			maxCells: 4
		};
		
		var apple = {
			x: 400,
			y: 400
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
			if (e.which === 37 && snake.dx === 0) {
				snake.dx = -grid;
				snake.dy = 0;
			}
			// up arrow key
			else if (e.which === 38 && snake.dy === 0) {
				snake.dy = -grid;
				snake.dx = 0;
			}
			// right arrow key
			else if (e.which === 39 && snake.dx === 0) {
				snake.dx = grid;
				snake.dy = 0;
			}
			// down arrow key
			else if (e.which === 40 && snake.dy === 0) {
				snake.dy = grid;
				snake.dx = 0;
			}
		}

		function reset() {
						snake.x = grid;
						snake.y = 400;
						snake.cells = [];
						snake.maxCells = 4;
						snake.dx = grid;
						snake.dy = 0;

						apple.x = getRandomInt(0, 25) * grid;
						apple.y = getRandomInt(0, 25) * grid;

		}

		// game loop
		function loop() {
			requestAnimationFrame(loop);
		
			// slow game loop to 15 fps instead of 60 (60/15 = 4)
			if (++count < (61 - fps)) {
				return;
			}

			count = 0;
			context.clearRect(0,0,canvas.width,canvas.height);

			// move snake by it's velocity
			snake.x += snake.dx;
			snake.y += snake.dy;

			// wrap snake position horizontally on edge of screen
			if (snake.x < 0) {
				reset();
			}
			else if (snake.x >= canvas.width) {
				reset();
			}
			
			// wrap snake position vertically on edge of screen
			if (snake.y < 0) {
				reset();
			}
			else if (snake.y >= canvas.height) {
				reset();
			}

			// keep track of where snake has been. front of the array is always the head
			snake.cells.unshift({x: snake.x, y: snake.y});

			// remove cells as we move away from them
			if (snake.cells.length > snake.maxCells) {
				snake.cells.pop();
			}

			// draw apple
			context.fillStyle = 'red';
			context.fillRect(apple.x, apple.y, grid-1, grid-1);

			// draw snake one cell at a time
			context.fillStyle = 'green';
			snake.cells.forEach(function(cell, index) {
				
				// drawing 1 px smaller than the grid creates a grid effect in the snake body so you can see how long it is
				context.fillRect(cell.x, cell.y, grid-1, grid-1);  

				// snake ate apple
				if (cell.x === apple.x && cell.y === apple.y) {
					snake.maxCells++;
					let dir = Math.random() < 0.5 ? -1 : 1;
					let tx = snake.dx*dir;
					let ty = snake.dy*dir;
					
					snake.dx = ty;
					snake.dy = tx;

					// canvas is 400x400 which is 25x25 grids 
					apple.x = getRandomInt(0, 50) * grid;
					apple.y = getRandomInt(0, 50) * grid;
				}

				// check collision with all cells after this one (modified bubble sort)
				for (var i = index + 1; i < snake.cells.length; i++) {
					
					// snake occupies same space as a body part. reset game
					if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
						snake.x = 4*16;
						snake.y = 25;
						snake.cells = [];
						snake.maxCells = 4;
						snake.dx = grid;
						snake.dy = 0;

						apple.x = getRandomInt(0, 25) * grid;
						apple.y = getRandomInt(0, 25) * grid;
					}
				}
			});
			}
		requestAnimationFrame(loop);
	});


</script>

<style>
	main {
		display:grid;
		grid-template-columns: 20vw 80vw ;
		grid-template-areas:"a b";
		height:100vh;
		width:100vw;
	}

	controlarea {
		grid-area:a;
		display:flex;
		flex-direction:column;
		justify-content: stretch;
		align-content: center;
		height:100%;
		padding-left:10px;
			
	}

	canvas {
		grid-area:b;		
    border: 1px solid black;
  }

</style>

<svelte:window on:keydown={handle_keydown}/>

<main>
<controlarea>
<p>Snake Speed: {fps} </p>

<label>
	<input type=range bind:value={fps} min=1 max=60 onkeydown="return false">
</label>

</controlarea>


<canvas
	bind:this={canvas}
	width={800}
	height={800}
></canvas>

</main>
