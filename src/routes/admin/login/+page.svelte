<script>
  let { form } = $props();
</script>

<div class="min-h-screen flex items-center justify-center">
  <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
    <h1 class="text-2xl font-bold text-center mb-6 text-gray-800">
      Admin Login
    </h1>

    <form method="POST" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1"
          >Email</label
        >
        <input
          type="email"
          id="email"
          name="email"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="admin@hashire.my.id"
        />
      </div>

      <div>
        <label
          for="password"
          class="block text-sm font-medium text-gray-700 mb-1">Password</label
        >
        <input
          type="password"
          id="password"
          name="password"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      {#if form?.error}
        <div class="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {form.error}
        </div>
      {/if}

      <button
        type="submit"
        class="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
      >
        Login
      </button>
    </form>

    <div class="mt-4 text-center">
      <a href="/" class="text-sm text-purple-600 hover:text-purple-800"
        >← Kembali ke Website</a
      >
    </div>
  </div>
</div>
