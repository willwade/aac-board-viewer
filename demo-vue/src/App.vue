<template>
  <div class="demo-shell">
    <header class="mb-8">
      <div class="flex flex-wrap items-center gap-3">
        <span class="demo-pill text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">Vue Demo</span>
        <h1 class="text-3xl font-semibold text-slate-900">AAC Board Viewer</h1>
      </div>
      <p class="mt-3 text-slate-600 max-w-2xl">
        Load an AAC board file in the browser and render it with the Vue renderer.
        SQL-backed formats require SQL.js to be configured (already wired below).
      </p>
    </header>

    <section class="demo-card p-6 mb-8">
      <div class="demo-file">
        <label class="block text-sm font-semibold text-slate-700">Select a board file</label>
        <input
          class="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
          type="file"
          @change="handleFileChange"
        />
        <div class="mt-4 text-xs text-slate-500">
          Browser compatible: {{ browserExtensions.join(', ') }}
        </div>
        <div class="text-xs text-slate-500">
          Server-only: {{ serverExtensions.join(', ') }}
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <div v-if="fileName" class="text-slate-700">
          Loaded: <span class="font-semibold">{{ fileName }}</span>
        </div>
        <div v-if="loading" class="text-blue-600 font-medium">Parsing board…</div>
        <div v-if="error" class="text-rose-600 font-medium">{{ error }}</div>
      </div>
    </section>

    <section v-if="tree" class="demo-card p-4">
      <BoardViewer
        :tree="tree"
        :show-message-bar="true"
        :show-effort-badges="true"
        :show-link-indicators="true"
        class-name="w-full"
      />
    </section>

    <section v-else class="demo-card p-6 text-slate-600">
      <p>Upload a compatible AAC file to preview it here.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { AACTree } from 'aac-board-viewer';
import {
  configureBrowserSqlJs,
  getBrowserExtensions,
  getNodeOnlyExtensions,
  isBrowserCompatible,
  loadAACFile,
} from 'aac-board-viewer';
import { BoardViewer } from 'aac-board-viewer/vue';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import 'aac-board-viewer/styles';
import './App.css';

configureBrowserSqlJs({
  locateFile: () => sqlWasmUrl,
});

const tree = ref<AACTree | null>(null);
const error = ref<string | null>(null);
const loading = ref(false);
const fileName = ref('');

const browserExtensions = getBrowserExtensions();
const serverExtensions = getNodeOnlyExtensions();

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  fileName.value = file.name;
  error.value = null;
  tree.value = null;

  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (!isBrowserCompatible(extension)) {
    error.value = `"${extension}" requires server processing. Try a browser-compatible format.`;
    return;
  }

  try {
    loading.value = true;
    tree.value = await loadAACFile(file);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to parse board.';
  } finally {
    loading.value = false;
  }
};
</script>
