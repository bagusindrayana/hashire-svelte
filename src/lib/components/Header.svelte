<script>
	import { page } from "$app/stores";
</script>

<header class="bg-white shadow-md fixed w-full z-50">
	<div class="container mx-auto px-6 py-3">
		<div class="flex items-center justify-between">
			<div class="text-2xl font-bold text-purple-600">
				<a href="/">Hashire!</a>
			</div>
			<div class="hidden md:flex items-center space-x-6">
				<a href="/" class="nav-item" class:active={$page.url.pathname == "/"}>✧ Home</a>
				<a href="/event" class="nav-item" class:active={$page.url.pathname.includes("/event")}>✧ Event</a>
				<a
					href="/horse"
					class="nav-item"
					class:active={$page.url.pathname.includes("/horse")}
					>✧ Kuda Aktif</a
				>
			</div>

			<div class="md:hidden">
				<button class="text-gray-600 focus:outline-none">
					<svg
						class="h-6 w-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16m-7 6h7"
						></path>
					</svg>
				</button>
			</div>
		</div>
	</div>
</header>

<style lang="postcss">
	@reference "tailwindcss";

	.nav-item {
		@apply text-gray-600 font-semibold hover:text-purple-600;
	}

	.nav-item.active {
		@apply font-bold border-b-2 text-purple-600 border-purple-600;
	}
</style>
