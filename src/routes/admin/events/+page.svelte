<script>
  let { data } = $props();
  let searchQuery = $state('');

  let filteredEvents = $derived(
    data.events.filter(event => 
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  async function deleteEvent(id) {
    if (!confirm('Yakin hapus event ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      alert('Gagal hapus event');
    }
  }
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">Events</h1>
  </div>

  <div class="mb-4">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search events..."
      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    />
  </div>

  <div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upcoming</th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each filteredEvents as event}
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="font-medium">{event.title || '-'}</div>
              <div class="text-sm text-gray-500">{event.subtitle || ''}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">{event.date || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">{event.event_type || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 py-1 text-xs rounded-full {event.upcoming ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                {event.upcoming ? 'Yes' : 'No'}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <a href="/admin/events/{event.id}" class="text-purple-600 hover:text-purple-900 mr-3">Edit</a>
              <button onclick={() => deleteEvent(event.id)} class="text-red-600 hover:text-red-900">Delete</button>
            </td>
          </tr>
        {/each}
        {#if filteredEvents.length === 0}
          <tr>
            <td colspan="5" class="px-6 py-4 text-center text-gray-500">No events found</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <div class="mt-4">
    <a href="/admin/events/add" class="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
      + Add Event
    </a>
  </div>
</div>
