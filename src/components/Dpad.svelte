<script>

	export let direction = 0;
	
	function dpad_direction(d) {
		direction = d;
	}


</script>


<style>

/* ====================== D-PAD CSS ======================*/

  .d-pad {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: 48%;
    overflow: hidden;
  }
  .d-pad:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 5%;
    transform: translate(-50%, -50%);
    width: 66.6%;
    height: 66.6%;
    background: #ddd;
  }
  .d-pad:after {
    content: '';
    position: absolute;
    display: none;
    z-index: 2;
    width: 20%;
    height: 20%;
    top: 50%;
    left: 50%;
    background: #ddd;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.25s;
    cursor: pointer;
  }
  .d-pad:hover:after {
    width: 30%;
    height: 30%;
  }
  .d-pad div {
    display: block;
    position: absolute;
    -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
    width: 33.3%;
    height: 43%;
    line-height: 40%;
    color: #fff;
    background: #ddd;
    text-align: center;
  }
  .d-pad div:hover {
    background: #eee;
  }
  .d-pad div:before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-radius: 5px;
    border-style: solid;
    transition: all 0.25s;
  }
  .d-pad div:after {
    content: '';
    position: absolute;
    width: 102%;
    height: 78%;
    background: #1b212c;
    border-radius: 20%;
  }
  .d-pad div.left,
  .d-pad div.right {
    width: 43%;
    height: 33%;
  }
  .d-pad div.left:after,
  .d-pad div.right:after {
    width: 78%;
    height: 102%;
  }
  .d-pad div.up {
    top: 0;
    left: 50%;
    transform: translate(-50%, 0);
    border-radius: 17% 17% 50% 50%;
  }
  .d-pad div.up:hover {
    background: linear-gradient(0deg, #ddd 0%, #eee 50%);
  }
  .d-pad div.up:after {
    left: 0;
    top: 0;
    transform: translate(-100%, 0);
    border-top-left-radius: 50%;
    pointer-events: none;
  }
  .d-pad div.up:before {
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-width: 0 13px 19px 13px;
    border-color: transparent transparent #aaa transparent;
  }
  .d-pad div.up:active:before {
    border-bottom-color: #333;
  }
  .d-pad div.up:hover:before {
    top: 35%;
  }
  .d-pad div.down {
    bottom: 0;
    left: 50%;
    transform: translate(-50%, 0);
    border-radius: 50% 50% 17% 17%;
  }
  .d-pad div.down:hover {
    background: linear-gradient(180deg, #ddd 0%, #eee 50%);
  }
  .d-pad div.down:after {
    right: 0;
    bottom: 0;
    transform: translate(100%, 0);
    border-bottom-right-radius: 50%;
    pointer-events: none;
  }
  .d-pad div.down:before {
    bottom: 40%;
    left: 50%;
    transform: translate(-50%, 50%);
    border-width: 19px 13px 0px 13px;
    border-color: #aaa transparent transparent transparent;
  }
  .d-pad div.down:active:before {
    border-top-color: #333;
  }
  .d-pad div.down:hover:before {
    bottom: 35%;
  }
  .d-pad div.left {
    top: 50%;
    left: 0;
    transform: translate(0, -50%);
    border-radius: 17% 50% 50% 17%;
  }
  .d-pad div.left:hover {
    background: linear-gradient(-90deg, #ddd 0%, #eee 50%);
  }
  .d-pad div.left:after {
    left: 0;
    bottom: 0;
    transform: translate(0, 100%);
    border-bottom-left-radius: 50%;
    pointer-events: none;
  }
  .d-pad div.left:before {
    left: 40%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-width: 13px 19px 13px 0;
    border-color: transparent #aaa transparent transparent;
  }
  .d-pad div.left:active:before {
    border-right-color: #333;
  }
  .d-pad div.left:hover:before {
    left: 35%;
  }
  .d-pad div.right {
    top: 50%;
    right: 0;
    transform: translate(0, -50%);
    border-radius: 50% 17% 17% 50%;
  }
  .d-pad div.right:hover {
    background: linear-gradient(90deg, #ddd 0%, #eee 50%);
  }
  .d-pad div.right:after {
    right: 0;
    top: 0;
    transform: translate(0, -100%);
    border-top-right-radius: 50%;
    pointer-events: none;
  }
  .d-pad div.right:before {
    right: 40%;
    top: 50%;
    transform: translate(50%, -50%);
    border-width: 13px 0 13px 19px;
    border-color: transparent transparent transparent #aaa;
  }
  .d-pad div.right:active:before {
    border-left-color: #333;
  }
  .d-pad div.right:hover:before {
    right: 35%;
  }



/* dpad custom css*/

.d-pad{
    margin:3rem;
    width:10rem;
    height:10rem;
}


</style>

<nav class="d-pad">
    <div class="up"  on:click={() => dpad_direction(38)}></div>
		<div class="right"  on:click={() => dpad_direction(39)}></div>
    <div class="down"  on:click={() => dpad_direction(40)}></div>
    <div class="left" on:click={() => dpad_direction(37)}></div>  
</nav>

