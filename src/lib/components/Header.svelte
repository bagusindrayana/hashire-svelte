<script>
	import { page } from "$app/stores";
	import { fly } from "svelte/transition";

	// State untuk mengontrol buka/tutup menu mobile
	let isMobileMenuOpen = false;

	// Fungsi untuk menutup menu (berguna saat link diklik)
	function closeMenu() {
		isMobileMenuOpen = false;
	}
</script>

<header class="bg-white shadow-md fixed w-full z-50">
	<div class="container mx-auto px-6 py-3">
		<div class="flex items-center justify-between">
			<div class="text-2xl font-bold text-purple-600">
				<a href="/" on:click={closeMenu}>
					<img
						src="/images/Logo_Hashire.png"
						alt="Logo Hashire!"
						class="h-10"
					/>
				</a>
			</div>

			<nav class="hidden md:flex items-center space-x-6">
				<a
					href="/"
					class="nav-item"
					class:active={$page.url === "/"}>Home</a
				>
				<a
					href="/event"
					class="nav-item"
					class:active={$page.url.pathname.includes("/event")}
					>Event</a
				>
				<a
					href="/horse"
					class="nav-item"
					class:active={$page.url.pathname.includes("/horse")}
					>Kuda Aktif</a
				>
			</nav>

			<div class="md:hidden">
				<button
					on:click={() => (isMobileMenuOpen = !isMobileMenuOpen)}
					class="text-gray-600 hover:text-purple-600 focus:outline-none"
					aria-label="Buka menu navigasi"
				>
					{#if isMobileMenuOpen}
						<svg
							class="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					{:else}
						<svg
							class="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16m-7 6h7"
							/>
						</svg>
					{/if}
				</button>
			</div>
		</div>

		{#if isMobileMenuOpen}
			<div
				transition:fly={{ y: -20, duration: 300 }}
				class="md:hidden mt-4"
				role="dialog"
				aria-modal="true"
			>
				<nav class="flex flex-col items-center space-y-4 py-4">
					<a
						href="/"
						class="nav-item"
						class:active={$page.url.pathname === "/"}
						on:click={closeMenu}>Home</a
					>
					<a
						href="/event"
						class="nav-item"
						class:active={$page.url.pathname.includes("/event")}
						on:click={closeMenu}>Event</a
					>
					<a
						href="/horse"
						class="nav-item"
						class:active={$page.url.pathname.includes("/horse")}
						on:click={closeMenu}>Kuda Aktif</a
					>
				</nav>
			</div>
		{/if}
	</div>
</header>

<style lang="postcss">
	@reference "tailwindcss";
	.nav-item {
		@apply text-gray-600 font-semibold hover:text-purple-600 transition-colors duration-200;
	}

	.nav-item.active {
		@apply font-bold text-purple-600 border-b-2 border-purple-600;
	}

	/* Style untuk item menu mobile agar lebih jelas */
	.md\:hidden .nav-item.active {
		@apply border-b-2 pb-1;
	}
</style>
