<script>
    export let kuda;

    function decodeHTMLEntities(str) {
		const div = document.createElement("div");
		div.innerHTML = str;
		const textName = div.textContent;
		return textName;
	}
</script>

<div class="space-y-1 md:space-y-3 text-xs md:text-sm grid grid-cols-2">
    <div class="flex items-center">
        <span
            class={`text-white font-bold py-1 px-2 md:px-3 rounded-md w-auto md:w-24 text-center ${kuda !== null ? `bg-2-${kuda.color_name}` : ""}`}
            >Trainer</span
        >
        <span class="ml-2 md:ml-4 text-gray-700"
            >{kuda.trainer ?? "-"}</span
        >
    </div>
    <div class="flex items-center">
        <span
            class={`text-white font-bold py-1 px-2 md:px-3 rounded-md w-auto md:w-24 text-center ${kuda !== null ? `bg-2-${kuda.color_name}` : ""}`}
            >Discipline</span
        >
        <span class="ml-2 md:ml-4 text-gray-700"
            >{kuda.discipline ?? "-"}</span
        >
    </div>
    <div class="flex items-center">
        <span
            class={`text-white font-bold py-1 px-2 md:px-3 rounded-md w-auto md:w-24 text-center ${kuda !== null ? `bg-2-${kuda.color_name}` : ""}`}
            >Birthday</span
        >
        <span class="ml-2 md:ml-4 text-gray-700"
            >{kuda.birth_year ?? "-"}</span
        >
    </div>
    <div class="flex items-center">
        <span
            class={`text-white font-bold py-1 px-2 md:px-3 rounded-md w-auto md:w-24 text-center ${kuda !== null ? `bg-2-${kuda.color_name}` : ""}`}
            >Height</span
        >
        <span class="ml-2 md:ml-4 text-gray-700"
            >{kuda.height ?? "-"}</span
        >
    </div>
    <div class="flex items-center">
        <span
            class={`text-white font-bold py-1 px-2 md:px-3 rounded-md w-auto md:w-24 text-center ${kuda !== null ? `bg-2-${kuda.color_name}` : ""}`}
            >Color</span
        >
        <span class="ml-2 md:ml-4 text-gray-700"
            >{kuda.color_name ?? "-"}</span
        >
    </div>
    <div class="flex items-center">
        <span
            class={`text-white font-bold py-1 px-2 md:px-3 rounded-md w-auto md:w-24 text-center ${kuda !== null ? `bg-2-${kuda.color_name}` : ""}`}
            >Trah</span
        >
        <span class="ml-2 md:ml-4 text-gray-700"
            >{kuda.generation_name ?? "-"}</span
        >
    </div>
    <div class="flex items-center">
        <span
            class={`text-white font-bold py-1 px-2 md:px-3 rounded-md w-auto md:w-24 text-center ${kuda !== null ? `bg-2-${kuda.color_name}` : ""}`}
            >Sire</span
        >
        <span class="ml-2 md:ml-4 text-gray-700"
            >{decodeHTMLEntities(kuda.father_name ?? "-")}</span
        >
    </div>
    <div class="flex items-center">
        <span
            class={`text-white font-bold py-1 px-2 md:px-3 rounded-md w-auto md:w-24 text-center ${kuda !== null ? `bg-2-${kuda.color_name}` : ""}`}
            >Dam</span
        >
        <span class="ml-2 md:ml-4 text-gray-700"
            >{decodeHTMLEntities(kuda.mother_name ?? "-")}</span
        >
    </div>
</div>
