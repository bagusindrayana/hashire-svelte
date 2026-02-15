<script>
  let { form } = $props();
</script>

<div class="max-w-2xl">
  <h1 class="text-2xl font-bold text-gray-800 mb-6">Add Horse</h1>

  <form method="POST" class="bg-white p-6 rounded-lg shadow space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
      <input
        type="text"
        id="name"
        name="name"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="color_name" class="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <input
          type="text"
          id="color_name"
          name="color_name"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label for="birth_year" class="block text-sm font-medium text-gray-700 mb-1">Birth Year</label>
        <input
          type="text"
          id="birth_year"
          name="birth_year"
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
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label for="breeder" class="block text-sm font-medium text-gray-700 mb-1">Breeder</label>
      <input
        type="text"
        id="breeder"
        name="breeder"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>

    <div>
      <label for="trainer" class="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
      <input
        type="text"
        id="trainer"
        name="trainer"
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
        Save
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
