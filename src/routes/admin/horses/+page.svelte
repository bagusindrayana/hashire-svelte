<script>
  let { data } = $props();
  let searchQuery = $state('');
  let syncing = $state(false);
  let syncResult = $state(null);

  let filteredHorses = $derived(
    data.horses.filter(horse => 
      horse.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      horse.color_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  async function syncHorses() {
    syncing = true;
    syncResult = null;
    
    try {
      const response = await fetch('/api/admin/sync-horses', { method: 'POST' });
      const result = await response.json();
      syncResult = result;
      
      if (result.success) {
        window.location.reload();
      }
    } catch (error) {
      syncResult = { success: false, error: error.message };
    } finally {
      syncing = false;
    }
  }

  async function deleteHorse(id) {
    if (!confirm('Yakin hapus horse ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/horses/${id}`, { method: 'DELETE' });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      alert('Gagal hapus horse');
    }
  }
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Horses</h1>
    <button
      onclick={syncHorses}
      disabled={syncing}
      class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
    >
      {syncing ? 'Syncing...' : '🔄 Sync dari Studbook'}
    </button>
  </div>

  {#if syncResult}
    <div class="mb-4 p-4 rounded-lg {syncResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
      {syncResult.success ? `${syncResult.count} horses synced!` : syncResult.error}
    </div>
  {/if}

  <div class="mb-4">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search horses..."
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    />
  </div>

  <div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birth Year</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generation</th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each filteredHorses as horse}
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap font-medium">{horse.name || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">{horse.color_name || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">{horse.birth_year || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">{horse.gender_name || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">{horse.generation_name || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <a href="/admin/horses/{horse.id}" class="text-purple-600 hover:text-purple-900 mr-3">Edit</a>
              <button onclick={() => deleteHorse(horse.id)} class="text-red-600 hover:text-red-900">Delete</button>
            </td>
          </tr>
        {/each}
        {#if filteredHorses.length === 0}
          <tr>
            <td colspan="6" class="px-6 py-4 text-center text-gray-500">No horses found</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <div class="mt-4">
    <a href="/admin/horses/add" class="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
      + Add Horse
    </a>
  </div>
</div>
