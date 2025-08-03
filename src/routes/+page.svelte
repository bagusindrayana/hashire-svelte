<script>
	import UmazingButton from "$lib/components/UmazingButton.svelte";
	import { onMount } from "svelte";
	let dataNews = [];
	let dataKlasemen = [
		{
			pos: 1,
			nama_kuda: "Thunder Bolt",
			nama_joki: "Budi Santoso",
			tim: "Garuda Stable",
			total_balapan: 25,
			menang: 12,
			runner_up: 6,
			peringkat_3: 3,
			poin: 145,
		},
		{
			pos: 2,
			nama_kuda: "Golden Flame",
			nama_joki: "Andre Wijaya",
			tim: "Nusantara Racing",
			total_balapan: 24,
			menang: 9,
			runner_up: 8,
			peringkat_3: 5,
			poin: 132,
		},
		{
			pos: 3,
			nama_kuda: "Majestic Wind",
			nama_joki: "Rahmat Hidayat",
			tim: "Merdeka Stables",
			total_balapan: 26,
			menang: 8,
			runner_up: 7,
			peringkat_3: 6,
			poin: 128,
		},
		{
			pos: 4,
			nama_kuda: "Silver Arrow",
			nama_joki: "Joko Prasetyo",
			tim: "Singa Emas",
			total_balapan: 23,
			menang: 7,
			runner_up: 6,
			peringkat_3: 5,
			poin: 110,
		},
		{
			pos: 5,
			nama_kuda: "Black Thunder",
			nama_joki: "Dani Setiawan",
			tim: "Bintang Timur",
			total_balapan: 22,
			menang: 6,
			runner_up: 5,
			peringkat_3: 7,
			poin: 98,
		},
		{
			pos: 6,
			nama_kuda: "Red Fury",
			nama_joki: "Satria Ramadhan",
			tim: "Garuda Stable",
			total_balapan: 20,
			menang: 5,
			runner_up: 4,
			peringkat_3: 6,
			poin: 86,
		},
		{
			pos: 7,
			nama_kuda: "Storm Breaker",
			nama_joki: "Agung Saputra",
			tim: "Nusantara Racing",
			total_balapan: 20,
			menang: 3,
			runner_up: 6,
			peringkat_3: 4,
			poin: 79,
		},
		{
			pos: 8,
			nama_kuda: "White Lightning",
			nama_joki: "Rizky Firmansyah",
			tim: "Merdeka Stables",
			total_balapan: 21,
			menang: 4,
			runner_up: 3,
			peringkat_3: 5,
			poin: 74,
		},
	];

	let loadingNews = true;
	onMount(async () => {
		loadingNews = true;
		try {
			const res = await fetch("/api/news");
			const json = await res.json();
			dataNews = json;
		} catch (error) {
			alert(error);
		}
		loadingNews = false;
	});
</script>

<svelte:head>
	<title>Home</title>
	<style>
		body {
			font-family: "Inter", sans-serif;
		}
	</style>
</svelte:head>

<main class="container mx-auto px-6 py-16 relative min-h-[90vh]">
	<div class="mx-auto text-center mt-12 min-h-[50vh] flex flex-col justify-center">
		<img class="mx-auto my-12" src="/images/Logo_Hashire.png" alt="" />
		<div class="flex gap-4 justify-center">
			
			<a href="/event">
				<UmazingButton text="Event" />
			</a>
			<a href="/horse">
				<UmazingButton text="Kuda Aktif" />
			</a>
		</div>
	</div>
	<div class="w-full max-w-4xl mx-auto grid grid-cols-1 gap-8">
		<div
			class="w-full bg-[#FFF6FA] border-4 border-[#F472B6] rounded-2xl shadow-lg relative p-3 py-6 md:p-6 md:py-12 m-auto mt-12"
		>
			<div class="absolute -top-6 -left-4">
				<div
					class="bg-[#F472B6] text-white py-2 px-10 transform -skew-x-12 shadow-md"
				>
					<h1
						class="transform skew-x-12 text-xl md:text-3xl font-extrabold"
					>
						News
					</h1>
				</div>
			</div>

			<!-- Daftar Berita -->
			<div class="space-y-4">
				{#each dataNews as news, index}
					<div class="bg-white p-4 rounded-xl shadow-md">
						{#if news.image != null}
							<a href="#">
								<img
									src={news.image}
									alt={`[Gambar dari ${news.title}]`}
									class="rounded-lg mb-3 w-full object-cover"
								/>
							</a>
						{/if}
						<a
							href="#"
							class="flex justify-between items-center w-full group"
						>
							<div>
								<div class="flex items-center mb-1">
									{#if news.type == "race"}
										<span
											class="bg-lime-200 text-lime-800 text-xs font-bold mr-2 px-2.5 py-0.5 rounded-full"
											>Race</span
										>
									{:else}
										<span
											class="bg-blue-200 text-blue-800 text-xs font-bold mr-2 px-2.5 py-0.5 rounded-full"
											>News</span
										>
									{/if}

									<span class="text-sm text-gray-500"
										>{news.date}</span
									>
								</div>
								<p
									class="font-semibold text-gray-800 group-hover:text-pink-600 transition-colors"
								>
									{news.title}
								</p>
							</div>
							<!-- <span
							class="text-pink-400 font-extrabold text-2xl ml-4 group-hover:translate-x-1 transition-transform"
							>>></span
						> -->
						</a>
					</div>
				{/each}
				{#if loadingNews}
					<div class="loader w-24 absolute m-auto text-center">
						<img src="images/Logo_Hashire.png" alt="Loading..." />
						<small>Loading...</small>
					</div>
				{/if}
			</div>
		</div>
		<div
			class="w-full bg-purple-200 border-4 border-purple-500 rounded-2xl shadow-lg relative p-3 py-6 md:p-6 md:py-12 m-auto mt-12"
		>
			<div class="absolute -top-6 -left-4">
				<div
					class="bg-purple-400 text-white py-2 px-10 transform -skew-x-12 shadow-md"
				>
					<h1
						class="transform skew-x-12 text-xl md:text-3xl font-extrabold"
					>
						Klasemen
					</h1>
				</div>
			</div>

			<!-- Daftar Berita -->
			<div class="space-y-4">
				<div class="overflow-auto rounded-xl shadow-md">
					<table class="w-full text-left">
						<thead
							class="bg-purple-400 text-white uppercase tracking-wider font-bold"
						>
							<tr
								><th colspan="9" class="p-2 text-center"
									>Klasemen Kuda Pacu Indonesia 2025</th
								></tr
							>
							<tr
								><th scope="col" class="px-3 py-2 text-center">
									Pos
								</th><th
									scope="col"
									class="px-3 py-2 text-center">Kuda</th
								><th scope="col" class="px-3 py-2 text-center"
									>Joki</th
								><th scope="col" class="px-3 py-2 text-center"
									>Tim</th
								><th scope="col" class="px-3 py-2 text-center"
									>Balapan</th
								>
								<th scope="col" class="px-3 py-2 text-center"
									>1st</th
								><th scope="col" class="px-3 py-2 text-center"
									>2nd</th
								><th scope="col" class="px-3 py-2 text-center"
									>3th</th
								><th scope="col" class="px-3 py-2 text-center"
									>Poin</th
								></tr
							>
						</thead>
						<tbody class="bg-white">
							{#each dataKlasemen as klasemen, index}
								<tr
									class="border-b border-gray-200 text-gray-600"
								>
									<td class="px-3 py-2 text-center"
										>{klasemen.pos}</td
									>
									<td class="px-3 py-2 text-center"
										>{klasemen.nama_kuda}</td
									>
									<td class="px-3 py-2 text-center"
										>{klasemen.nama_joki}</td
									>
									<td class="px-3 py-2 text-center"
										>{klasemen.tim}</td
									>
									<td class="px-3 py-2 text-center"
										>{klasemen.total_balapan}</td
									>
									<td class="px-3 py-2 text-center"
										>{klasemen.menang}</td
									>
									<td class="px-3 py-2 text-center"
										>{klasemen.runner_up}</td
									>
									<td class="px-3 py-2 text-center"
										>{klasemen.peringkat_3}</td
									>
									<td class="px-3 py-2 text-center"
										>{klasemen.poin}</td
									>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
</main>
