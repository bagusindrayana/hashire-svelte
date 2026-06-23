<script>
  let { children, data } = $props();
</script>

<div class="min-h-screen bg-gray-50">
  {#if data.session}
    <nav class="bg-purple-700 text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <a href="/admin" class="text-xl font-bold">Hashire Admin</a>
          </div>
          <div class="flex items-center space-x-4">
            <a href="/admin/horses" class="px-3 py-2 rounded hover:bg-purple-600">Horses</a>
            <a href="/admin/events" class="px-3 py-2 rounded hover:bg-purple-600">Events</a>
            <a href="/admin/news" class="px-3 py-2 rounded hover:bg-purple-600">News</a>
            <form action="/admin/logout" method="POST" class="inline">
              <button type="submit" class="px-3 py-2 rounded bg-red-600 hover:bg-red-700">
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  {/if}

  <main class="max-w-7xl mx-auto px-4 py-8">
    {@render children()}
  </main>
</div>
