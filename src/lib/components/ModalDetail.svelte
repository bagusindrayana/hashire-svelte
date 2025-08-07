<script>
    import { onMount } from "svelte";
    import UmazingButton from "./UmazingButton.svelte";

    export let title = null;
    export let onClose = null;


    let closeLabel = ["Umazing!","Kudashyat!","Umantap!"];
	let modalCloseLabel = "Umazing";

    onMount(()=>{
        modalCloseLabel = closeLabel[Math.floor(Math.random() * closeLabel.length)];
    });

    
    
</script>

<!-- Overlay fixed full screen -->
<div class="fixed inset-0 z-50 bg-gray-400/75 overflow-y-auto">
    <!-- Modal wrapper with margin top to allow scrolling -->
    <div class="flex justify-center items-start min-h-screen p-4 md:p-12">
        <!-- Modal content box -->
        <div
            class="relative w-full max-w-4xl bg-[#FFF6FA] border-4 border-[#F472B6] rounded-2xl shadow-lg p-3 md:p-6 pt-8 md:pt-12 my-12 md:my-4"
        >
            <!-- Skewed title -->
            <div class="ml-0 -mt-16 md:-ml-10">
                <div
                    class="bg-[#F472B6] text-white py-2 px-10 transform -skew-x-12 shadow-md"
                >
                    <h1
                        class="transform skew-x-12 text-lg md:text-3xl font-extrabold"
                    >
                        {title}
                    </h1>
                </div>
            </div>

            <!-- Body -->
            <div class="py-4 min-h-[50vh]">
                <slot></slot>
            </div>

            <!-- Close button -->
            <div class="w-full flex justify-center items-center">
                <UmazingButton
                    onClick={() => {
                        if(onClose){
                            onClose();
                        }
                    }}
                    icon="👍"
                    text={modalCloseLabel}
                />
            </div>
        </div>
    </div>
</div>
