<script>
  export let pejantan;
  export let induk;

  let tableRows = [];

  /**
   * Fungsi rekursif untuk memproses data silsilah.
   * Kini dapat menangani data berupa objek (untuk generasi 1-3) atau string (untuk generasi 4).
   */
  function buildGenerations(node, colIndex, rowIndex, gender) {
    if (!node || colIndex > 3) {
      return;
    }

    const rowspan = 16 / (2 ** (colIndex + 1));
    let currentName = '';
    
    // Cek tipe data node untuk mendapatkan nama
    if (typeof node === 'object' && node !== null) {
      currentName = node.nama;
    } else if (typeof node === 'string') {
      currentName = node;
    }

    tableRows[rowIndex].push({
      nama: currentName,
      rowspan: rowspan,
      gender: gender
    });

    // Lanjutkan rekursi hanya jika node adalah objek (memiliki keturunan)
    if (typeof node === 'object' && node !== null) {
      buildGenerations(node.pejantan, colIndex + 1, rowIndex, 'sire');
      buildGenerations(node.induk, colIndex + 1, rowIndex + (rowspan / 2), 'dam');
    }
  }

  // Blok reaktif untuk mengolah data saat props berubah
  $: {
    tableRows = Array(16).fill(null).map(() => []);
    buildGenerations(pejantan, 0, 0, 'sire');
    buildGenerations(induk, 0, 8, 'dam');
  }
</script>

<div class="overflow-x-auto rounded-lg bg-gray-50 p-4 shadow-md">
  <table class="min-w-[800px] w-full border-collapse text-center text-sm">
    <tbody class="align-top">
      {#each tableRows as rowData}
        <tr>
          {#each rowData as cell}
            <td
              rowspan={cell.rowspan}
              class="border border-gray-400 p-2 font-semibold wrap-break-word whitespace-nowrap"
              class:bg-blue-100={cell.gender === 'sire'}
              class:text-blue-800={cell.gender === 'sire'}
              class:bg-pink-100={cell.gender === 'dam'}
              class:text-pink-800={cell.gender === 'dam'}
            >
              {cell.nama || 'Data tidak diketahui'}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>