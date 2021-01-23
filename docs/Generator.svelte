<div class="container">
	<div class="display">
		{#each matrix as r, i}
		<div>
			{#each r as c, i2}
				<div class="led" class:lit={matrix[i][i2] === 1} on:click={() => toggle(i, i2)}></div>
			{/each}
		</div>
		{/each}
	</div>

	<textarea bind:this={json}>
	{JSON.stringify(matrix)}
	</textarea>

	<button type="button" on:click={copy}>
		{buttonText}
	</button>
</div>

<script>
	let json
	let buttonText = 'Copy Matrix to Clipboard'
	const matrix = new Array(8).fill(0).map(r => new Array(8).fill(0))
	
	function toggle (r, c) {
		matrix[r][c] = matrix[r][c] ? 0 : 1
	}
	
	function copy () {
		json.select()
		document.execCommand('copy')
		buttonText = 'Copied!'
		setTimeout(() => {
			buttonText = 'Copy Matrix to Clipboard'
		}, 2000)
	}	
</script>

<style>
	.container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100vh;
		width: 100vh;
	}

	.display {
		display: flex;
	}
	
	textarea {
		position: absolute;
		left: -400px;
	}
	
	.display > div {
		background-color: black;
	}
	
	.led {
		height: 32px;
		width: 32px;
		margin: 2px;
		border-radius: 16px;
		background-color: grey;
	}
	
	.lit {
		background-color: red;
	}

	button {
		margin-top: 12px;
		font-size: 18px;
		padding: 12px 24px;
		border: 2px solid darkslategrey;
		background: none;
		box-shadow: none;
		border-radius: 0px;
	}

	button:hover {
		background: darkslategrey;
		color: white;
	}
</style>