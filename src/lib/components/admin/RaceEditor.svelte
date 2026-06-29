<script>
  /** @type {{ races: import('./types').Race[], onchange: (races: import('./types').Race[]) => void }} */
  let { races = $bindable([]), onchange } = $props();

  function addRace() {
    races = [
      ...races,
      {
        race: '',
        distance: 800,
        prize: 0,
        time: '',
        horses: []
      }
    ];
    onchange?.(races);
  }

  function removeRace(raceIdx) {
    races = races.filter((_, i) => i !== raceIdx);
    onchange?.(races);
  }

  function addHorse(raceIdx) {
    const updated = races.map((r, i) => {
      if (i !== raceIdx) return r;
      const nextNo = (r.horses?.length ?? 0) + 1;
      return {
        ...r,
        horses: [
          ...(r.horses ?? []),
          { no: nextNo, name: '', daerah: '', gate: nextNo }
        ]
      };
    });
    races = updated;
    onchange?.(races);
  }

  function removeHorse(raceIdx, horseIdx) {
    const updated = races.map((r, i) => {
      if (i !== raceIdx) return r;
      const horses = r.horses.filter((_, hi) => hi !== horseIdx).map((h, hi) => ({
        ...h,
        no: hi + 1
      }));
      return { ...r, horses };
    });
    races = updated;
    onchange?.(races);
  }

  function updateRace(raceIdx, field, value) {
    races = races.map((r, i) =>
      i === raceIdx ? { ...r, [field]: value } : r
    );
    onchange?.(races);
  }

  function updateHorse(raceIdx, horseIdx, field, value) {
    races = races.map((r, i) => {
      if (i !== raceIdx) return r;
      const horses = r.horses.map((h, hi) =>
        hi === horseIdx ? { ...h, [field]: value } : h
      );
      return { ...r, horses };
    });
    onchange?.(races);
  }

  const inputCls = 'w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm';
</script>

<div class="space-y-4">
  <div class="flex justify-between items-center">
    <h3 class="text-sm font-semibold text-gray-700">Detail Race (detail_data)</h3>
    <button
      type="button"
      onclick={addRace}
      class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
    >
      + Tambah Race
    </button>
  </div>

  {#each races as race, raceIdx}
    <div class="border border-gray-200 rounded-lg overflow-hidden">
      <!-- Race header -->
      <div class="bg-gray-50 px-4 py-3 flex justify-between items-center">
        <span class="font-medium text-sm text-gray-700">Race {raceIdx + 1}{race.race ? ': ' + race.race : ''}</span>
        <button
          type="button"
          onclick={() => removeRace(raceIdx)}
          class="text-red-500 hover:text-red-700 text-sm"
        >
          Hapus Race
        </button>
      </div>

      <!-- Race fields -->
      <div class="p-4 space-y-3">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="col-span-2">
            <label class="block text-xs text-gray-500 mb-1">Nama Race *</label>
            <input
              type="text"
              value={race.race}
              oninput={(e) => updateRace(raceIdx, 'race', e.target.value)}
              placeholder="e.g., Kelas 2 Tahun Perdana"
              class={inputCls}
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Jarak (m)</label>
            <input
              type="number"
              value={race.distance}
              oninput={(e) => updateRace(raceIdx, 'distance', Number(e.target.value))}
              placeholder="800"
              class={inputCls}
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Waktu</label>
            <input
              type="text"
              value={race.time}
              oninput={(e) => updateRace(raceIdx, 'time', e.target.value)}
              placeholder="08:00"
              class={inputCls}
            />
          </div>
          <div class="col-span-2">
            <label class="block text-xs text-gray-500 mb-1">Hadiah (Rp)</label>
            <input
              type="number"
              value={race.prize}
              oninput={(e) => updateRace(raceIdx, 'prize', Number(e.target.value))}
              placeholder="15000000"
              class={inputCls}
            />
          </div>
        </div>

        <!-- Horses table -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-medium text-gray-600">Kuda ({race.horses?.length ?? 0})</span>
            <button
              type="button"
              onclick={() => addHorse(raceIdx)}
              class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Tambah Kuda
            </button>
          </div>

          {#if race.horses?.length > 0}
            <div class="overflow-x-auto">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="bg-gray-100 text-xs text-gray-500 uppercase">
                    <th class="px-2 py-2 text-left w-10">No</th>
                    <th class="px-2 py-2 text-left">Nama Kuda</th>
                    <th class="px-2 py-2 text-left w-28">Daerah</th>
                    <th class="px-2 py-2 text-left w-16">Gate</th>
                    <th class="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  {#each race.horses as horse, horseIdx}
                    <tr>
                      <td class="px-2 py-1.5 text-gray-500 text-center">{horse.no}</td>
                      <td class="px-2 py-1.5">
                        <input
                          type="text"
                          value={horse.name}
                          oninput={(e) => updateHorse(raceIdx, horseIdx, 'name', e.target.value)}
                          placeholder="Nama kuda"
                          class={inputCls}
                        />
                      </td>
                      <td class="px-2 py-1.5">
                        <input
                          type="text"
                          value={horse.daerah}
                          oninput={(e) => updateHorse(raceIdx, horseIdx, 'daerah', e.target.value.toUpperCase())}
                          placeholder="JATIM"
                          class={inputCls}
                        />
                      </td>
                      <td class="px-2 py-1.5">
                        <input
                          type="number"
                          value={horse.gate}
                          oninput={(e) => updateHorse(raceIdx, horseIdx, 'gate', Number(e.target.value))}
                          placeholder="1"
                          class={inputCls}
                        />
                      </td>
                      <td class="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onclick={() => removeHorse(raceIdx, horseIdx)}
                          class="text-red-400 hover:text-red-600"
                          title="Hapus kuda"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <p class="text-xs text-gray-400 italic py-2">Belum ada kuda. Klik "+ Tambah Kuda".</p>
          {/if}
        </div>
      </div>
    </div>
  {/each}

  {#if races.length === 0}
    <p class="text-sm text-gray-400 italic">Belum ada race. Klik "+ Tambah Race" untuk mulai.</p>
  {/if}
</div>
