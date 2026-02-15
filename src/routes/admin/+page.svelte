<script>
  let { data } = $props();
</script>

<div>
  <h1 class="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <a href="/admin/horses" class="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
      <div class="text-4xl font-bold text-purple-600">{data.horsesCount}</div>
      <div class="text-gray-600 mt-2">Total Horses</div>
    </a>

    <a href="/admin/events" class="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
      <div class="text-4xl font-bold text-green-600">{data.eventsCount}</div>
      <div class="text-gray-600 mt-2">Total Events</div>
    </a>

    <a href="/admin/news" class="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
      <div class="text-4xl font-bold text-blue-600">{data.newsCount}</div>
      <div class="text-gray-600 mt-2">Total News</div>
    </a>
  </div>

  <div class="mt-8 bg-white p-6 rounded-lg shadow">
    <h2 class="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
    <div class="flex flex-wrap gap-4">
      <a href="/admin/horses/add" class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
        + Add Horse
      </a>
      <a href="/admin/events/add" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        + Add Event
      </a>
      <a href="/admin/news/add" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        + Add News
      </a>
      <a href="/admin/horses" class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
        🔄 Sync Horses
      </a>
    </div>
  </div>

  <div class="mt-8 bg-white p-6 rounded-lg shadow">
    <h2 class="text-xl font-semibold text-gray-800 mb-4">Website</h2>
    <a href="/" target="_blank" class="text-purple-600 hover:text-purple-800 underline">
      Lihat Website →
    </a>
  </div>
</div>
