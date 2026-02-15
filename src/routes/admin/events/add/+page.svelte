<script>
  let { form } = $props();
</script>

<div class="max-w-2xl">
  <h1 class="text-2xl font-bold text-gray-800 mb-6">Add Event</h1>

  <form method="POST" class="bg-white p-6 rounded-lg shadow space-y-4">
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
      <input
        type="text"
        id="title"
        name="title"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>

    <div>
      <label for="subtitle" class="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
      <input
        type="text"
        id="subtitle"
        name="subtitle"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="date" class="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="text"
          id="date"
          name="date"
          placeholder="e.g., 9 November 2025"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div>
        <label for="event_type" class="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          id="event_type"
          name="event_type"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="race">Race</option>
          <option value="news">News</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>

    <div>
      <label for="image_url" class="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
      <input
        type="url"
        id="image_url"
        name="image_url"
        placeholder="https://..."
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>

    <div class="flex items-center">
      <input
        type="checkbox"
        id="upcoming"
        name="upcoming"
        value="true"
        class="h-4 w-4 text-green-600 border-gray-300 rounded"
      />
      <label for="upcoming" class="ml-2 block text-sm text-gray-700">Upcoming Event</label>
    </div>

    {#if form?.error}
      <div class="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
        {form.error}
      </div>
    {/if}

    <div class="flex gap-4">
      <button
        type="submit"
        class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Save
      </button>
      <a
        href="/admin/events"
        class="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
      >
        Cancel
      </a>
    </div>
  </form>
</div>
