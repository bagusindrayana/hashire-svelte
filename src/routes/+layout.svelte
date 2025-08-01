<script>
    import "../app.css";
    import Header from "$lib/components/Header.svelte";
</script>

<Header />
<div
    class="fixed bg-gray-600 m-auto left-0 right-0 top-0 bottom-0 flex justify-center items-center z-50 text-white transition-all duration-500 opacity-75 hidden" id="full-loading"
>
    <div class="loader w-24 abosulute m-auto text-center">
        <img src="images/Logo_Hashire.png" alt="Loading..." />
        <small>Loading...</small>
    </div>
</div>
<slot></slot>
