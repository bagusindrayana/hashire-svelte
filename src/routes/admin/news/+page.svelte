<script>
  let { data } = $props();
  let searchQuery = $state('');

  let filteredNews = $derived(
    data.news.filter(item => 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  async function deleteNews(id) {
    if (!confirm('Yakin hapus news ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      alert('Gagal hapus news');
    }
  }
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">News</h1>
  </div>

  <div class="mb-4">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search news..."
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
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each filteredNews as item}
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="font-medium">{item.title || '-'}</div>
              <div class="text-sm text-gray-500">{item.subtitle || ''}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">{item.date || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">{item.news_type || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <a href="/admin/news/{item.id}" class="text-purple-600 hover:text-purple-900 mr-3">Edit</a>
              <button onclick={() => deleteNews(item.id)} class="text-red-600 hover:text-red-900">Delete</button>
            </td>
          </tr>
        {/each}
        {#if filteredNews.length === 0}
          <tr>
            <td colspan="4" class="px-6 py-4 text-center text-gray-500">No news found</td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <div class="mt-4">
    <a href="/admin/news/add" class="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      + Add News
    </a>
  </div>
</div>
