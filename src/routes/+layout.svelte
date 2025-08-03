<script>
    import "../app.css";
    import Header from "$lib/components/Header.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import UmazingButton from "$lib/components/UmazingButton.svelte";

    let showModal = true;
</script>

<Header />
<div
    class="fixed bg-gray-600 m-auto left-0 right-0 top-0 bottom-0 flex justify-center items-center z-50 text-white transition-all duration-500 opacity-75 hidden"
    id="full-loading"
>
    <div class="loader w-24 absolute m-auto text-center">
        <img src="images/Logo_Hashire.png" alt="Loading..." />
        <small>Loading...</small>
    </div>
</div>

<slot></slot>

{#if showModal}
    <div
        class="fixed top-0 left-0 bottom-0 right-0 p-2 md:p-12 flex justify-center items-center z-50 m-auto"
    >
        <div
            class="absolute top-0 left-0 bottom-0 right-0 m-auto bg-gray-400 opacity-75"
        ></div>
        <div
            class="w-full max-w-4xl bg-[#FFF6FA] border-4 border-[#F472B6] rounded-2xl shadow-lg relative p-3 md:p-6 pt-8 md:pt-12 "
        >
            <div class="absolute -top-6 -left-4">
                <div
                    class="bg-[#F472B6] text-white py-2 px-10 transform -skew-x-12 shadow-md"
                >
                    <h1 class="transform skew-x-12 text-3xl font-extrabold">
                        Informasi!
                    </h1>
                </div>
            </div>
            <div class="space-y-4 relative min-h-[60vh]">
                <p class="md:text-2xl">
                    Semua informasi di situs ini bersumber dari data <a
                        class="border-b border-blue-500 text-blue-500"
                        href="https://studbook.or.id/">Studbook Indonesia</a
                    >
                    serta
                    <a
                        class="border-b border-blue-500 text-blue-500"
                        href="https://pordasi.id/pacu/">Pordasi</a
                    >. Gambar dan media yang ditampilkan pada situs ini hanya
                    sebagai illustrasi dan tidak merepresentasikan aslinya.
                </p>
                <p class="md:text-2xl">
                    Situs ini hanya sebagai "fan-art" atau apresiasi fan
                    terhadap kuda-kuda pacu di indonesia, semua nama atau merek
                    yang tercantum pada situs ini tetap dipegang oleh
                    masing-masing pemegang hak aslinya.
                </p>
                <p class="md:text-2xl">
                    Jika ada yang ingin ditanyakan silahkan untuk berdiskusi
                    melalui <a
                        href="https://github.com/bagusindrayana/hashire-svelte"
                        class="border-b border-blue-500 text-blue-500"
                        >Repository</a
                    > project ini.
                </p>
            </div>
            <div class="w-full flex justify-center items-center">
                <UmazingButton
                    onClick={() => {
                        showModal = false;
                    }}
                    icon="👍"
                    text="Umazing!"
                />
            </div>
        </div>
    </div>
{/if}

<Footer />
