<script>
    export let onClick;
    export let icon = null;
    export let text = null;
</script>

<button
    onclick={onClick}
    class="amazing-button relative inline-flex items-center justify-center gap-3 sm:gap-4 px-2 sm:px-4 py-1 sm:py-2 cursor-pointer
                   text-white text-xl sm:text-2xl font-bold tracking-wide
                   bg-gradient-to-br from-lime-500 to-green-600
                   rounded-3xl
                   border-2 border-green-800 border-b-[6px]
                   active:border-b-[2px] active:translate-y-2
                   transition-all duration-100 ease-in-out
                   shadow-xl overflow-hidden hover:scale-110"
>

    {#if icon}
        <div class="absolute z-10 left-0 top-1">
        <div
            class="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 transform rotate-12"
        >
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M50 0L61.226 38.774L100 50L61.226 61.226L50 100L38.774 61.226L0 50L38.774 38.774L50 0Z"
                    fill="#FFD60A"
                />
                <path
                    d="M50 25L56.1258 43.8742L75 50L56.1258 56.1258L50 75L43.8742 56.1258L25 50L43.8742 43.8742L50 25Z"
                    fill="white"
                />
            </svg>
        </div>

        <div class="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md">{icon}</div>
    </div>
    {/if}

    {#if text}
        <span class={`relative z-10 ${icon ? "ml-12" : ""}`}>{text}</span>
    {/if}
</button>

<style>
    /* Menambahkan font kustom dan gaya yang tidak tersedia di Tailwind secara default */
    @import url("https://fonts.googleapis.com/css2?family=Fredoka:wght@700&display=swap");

    .amazing-button {
        /* Menggunakan font Fredoka yang tebal dan bulat, mirip dengan gambar */
        font-family: "Fredoka", sans-serif;
        /* Menambahkan bayangan teks untuk memberikan kedalaman */
        text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.25);
        /* Mencegah teks dan ikon dapat dipilih */
        user-select: none;
    }

    /* Membuat efek kilau diagonal di atas tombol menggunakan pseudo-element */
    .amazing-button::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 70%;
        height: 80%;
        background: linear-gradient(
            to bottom right,
            rgba(255, 255, 255, 0.4),
            rgba(255, 255, 255, 0)
        );
        border-radius: 1.5rem; /* Menyesuaikan dengan radius tombol */
        transform: rotate(-15deg) translate(-10px, -10px);
        opacity: 0.8;
    }
</style>
