<script>
  let { data, form } = $props();
  let horse = $state(data.horse || {});
  let isSyncing = $state(false);

  async function syncHorse() {
    if (!horse.name) {
      alert("Please enter a horse name first to sync.");
      return;
    }
    isSyncing = true;
    try {
      const response = await fetch(`/api/horse?id=${encodeURIComponent(horse.name)}`);
      if (response.ok) {
        const resData = await response.json();
        
        if (resData && resData.profil) {
          if (resData.profil.nama) horse.name = resData.profil.nama;
          if (resData.profil.warna) horse.color_name = resData.profil.warna;
          if (resData.profil.tahun_lahir) horse.birth_year = resData.profil.tahun_lahir;
          if (resData.profil.trah) horse.generation_name = resData.profil.trah;
          
          if (resData.profil.jenis_kelamin) {
             const jk = resData.profil.jenis_kelamin.toLowerCase();
             if (jk === "betina") horse.gender_name = "Mare";
             else if (jk === "jantan") horse.gender_name = "Horse";
             else horse.gender_name = resData.profil.jenis_kelamin;
          }
        }
        if (resData && resData.pemilik) horse.owner = resData.pemilik;
        if (resData && resData.peternak) horse.breeder = resData.peternak;
        if (resData && resData.pelatih) horse.trainer = resData.pelatih;
        
      } else {
        alert("Failed to fetch data from Studbook.");
      }
    } catch (err) {
      console.error(err);
      alert("Error syncing data.");
    } finally {
      isSyncing = false;
    }
  }
</script>

<div class="max-w-2xl">
  <h1 class="text-2xl font-bold text-gray-800 mb-6">Edit Horse</h1>

  <form method="POST" class="bg-white p-6 rounded-lg shadow space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
      <div class="flex gap-2">
        <input
          type="text"
          id="name"
          name="name"
          required
          bind:value={horse.name}
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <button
          type="button"
          onclick={syncHorse}
          disabled={isSyncing}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center justify-center min-w-[140px]"
        >
          {#if isSyncing}
            <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Syncing...
          {:else}
            Sync Studbook
          {/if}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="color_name" class="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <input
          type="text"
          id="color_name"
          name="color_name"
          value={horse.color_name || ''}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label for="birth_year" class="block text-sm font-medium text-gray-700 mb-1">Birth Year</label>
        <input
          type="text"
          id="birth_year"
          name="birth_year"
          value={horse.birth_year || ''}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="gender_name" class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
        <select
          id="gender_name"
          name="gender_name"
          value={horse.gender_name || ''}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">Select...</option>
          <option value="Colt">Colt</option>
          <option value="Filly">Filly</option>
          <option value="Horse">Horse</option>
          <option value="Mare">Mare</option>
        </select>
      </div>

      <div>
        <label for="generation_name" class="block text-sm font-medium text-gray-700 mb-1">Generation</label>
        <input
          type="text"
          id="generation_name"
          name="generation_name"
          value={horse.generation_name || ''}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
    </div>

    <div>
      <label for="owner" class="block text-sm font-medium text-gray-700 mb-1">Owner</label>
      <input
        type="text"
        id="owner"
        name="owner"
        value={horse.owner || ''}
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label for="breeder" class="block text-sm font-medium text-gray-700 mb-1">Breeder</label>
      <input
        type="text"
        id="breeder"
        name="breeder"
        value={horse.breeder || ''}
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label for="trainer" class="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
      <input
        type="text"
        id="trainer"
        name="trainer"
        value={horse.trainer || ''}
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    {#if form?.error}
      <div class="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
        {form.error}
      </div>
    {/if}

    <div class="flex gap-4">
      <button
        type="submit"
        class="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Update
      </button>
      <a
        href="/admin/horses"
        class="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
      >
        Cancel
      </a>
    </div>
  </form>
</div>
