<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { type ParsedCidr } from './logic/types';
import { parseLst } from './logic/parse';
import { parse } from 'ipaddr.js';
import { computed } from '@vue/reactivity';
import { check } from './logic/check';

const loadPrgrs = ref<number>(0);
const loadText = ref<string>("loading...");
const target = ref<string>("");
const info = ref<{
  status: "unknown" | "whitelist" | "blacklist",
  ip: string | null
}>({
  status: "unknown",
  ip: "X.X.X.X"
});
const targetParsed = computed(() => {
  if (target.value === "") return null;
  try {
    return parse(target.value);
  } catch { return null };
});
const uiInputError = computed(() => targetParsed.value === null && target.value !== "")

const blackCidrs = ref<ParsedCidr[]>([]);
const whiteCidrs = ref<ParsedCidr[]>([]);
const totalBlack = ref<BigInt>(BigInt(0));
const totalWhite = ref<BigInt>(BigInt(0));

const setLoad = (text: string, prgrs: number) => {
  loadText.value = text;
  loadPrgrs.value = prgrs;
}

let debounceTimer: any = undefined;
watch(targetParsed, value => {
  if (value === null) return;
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (targetParsed.value === null) return;
    const inWhiteList = check(targetParsed.value, whiteCidrs.value);
    if (inWhiteList) {
      info.value = {
        status: "whitelist",
        ip: targetParsed.value.toString()
      }
      return;
    }
    if (targetParsed.value === null) return;
    const inBlackList = check(targetParsed.value, blackCidrs.value);
    if (inBlackList) {
      info.value = {
        status: "blacklist",
        ip: targetParsed.value.toString()
      }
      return;
    }

    info.value = {
      status: "unknown",
      ip: targetParsed.value.toString()
    }
  }, 100)
})

const updatedAt = ref<Date>(new Date(0));

onMounted(async () => {
  setLoad("loading metadata", 10);
  updatedAt.value = new Date(
    parseInt(
      (await (await fetch(`/whitecheck/data/update.time?invalidateCache=${Date.now()}`)).text()
    ).trim()) * 1000
  )
  setLoad("loading black.lst", 20);
  const blackContent = await (await fetch(`/whitecheck/data/black.lst?invalidateCache=${Date.now()}`)).text()
  setLoad("parsing black.lst", 40);
  const black = parseLst(blackContent)
  blackCidrs.value = black.parsed;
  totalBlack.value = black.total;
  setLoad("loading white.lst", 60);
  const whiteContent = await (await fetch(`/whitecheck/data/white.lst?invalidateCache=${Date.now()}`)).text()
  setLoad("parsing white.lst", 80);
  const white = parseLst(whiteContent)
  whiteCidrs.value = white.parsed;
  totalWhite.value = white.total;
  setLoad("done", 100);
})
</script>
<template>
  <div v-if="loadPrgrs !== 100" class="flex justify-center items-center h-screen w-screen flex-col overflow-hidden">
    <div class="text-4xl text-white font-semibold">whitecheck.</div>

    <div class="mt-3 w-75 h-2 bg-white/30 rounded-full">
      <div :style="{ width: loadPrgrs.toString() + '%' }"
        class="h-full bg-white/70 rounded-full transition-[width] duration-75"></div>
    </div>
    <div class="mt-2 text-sm text-white/80 font-semibold">{{ loadText }}</div>
  </div>
  <div v-else class="flex items-center mt-20 w-screen flex-col">
    <div class="text-4xl text-white font-semibold">whitecheck.</div>
    <input type="text"
      :class="['mt-4 w-90 block text-center border-2 placeholder-white/80 py-3 outline-0 transition-colors duration-150', uiInputError ? 'text-yellow-300' : 'text-white']"
      placeholder="введите айпи сюда." v-model="target" @input="target = target.replace(/\s/g, '')" />
    <div class="mt-4 text-sm text-white">{{ info.ip }} <span class="text-white/70">в</span> <span
        :class="info.status === 'whitelist' ? 'text-green-400' : info.status === 'blacklist' ? 'text-red-600' : 'text-white/90'">{{
          info.status }}</span></div>

    <div class="w-90 h-[2px] my-4 bg-white/30"></div>
    <div class="text-white text-[16px] w-90">
      <div class="">? - <span class="text-green-400 font-bold">whitelist</span> - {{ totalWhite }} айпи.<br>\ - ресурс
        <span class="font-bold">должен</span> работать даже в режиме белых списков.</div>
      <div class="mt-2">? - <span class="text-red-600 font-bold">blacklist</span>- {{ totalBlack }} айпи.<br>\ - <span
          class="font-bold">может</span> не работать вообще (зависит от провайдера).</div>
      <div class="mt-2">? - <span class="text-white/90 font-bold">unknown</span> - все остальное<br>\ - <span
          class="font-bold">должен</span> работать, но в режиме белых списков доступ будет ограничен.</div>
    </div>

    <div class="w-90 h-[2px] my-4 bg-white/30"></div>

    <div class="text-white text-[16px] w-90">
      <div class="">i - обновленно {{ updatedAt.toLocaleDateString('ru-RU', { dateStyle: 'long'}) }}</div>
      <div class="w-90 h-[2px] my-4 bg-white/30"></div>
      <div class="">(c)
        <br>|\| - данные whitelist от <a  class="text-blue-500" href="https://github.com/hxehex/russia-mobile-internet-whitelist" target="_blank">hxehex</a>
        <br>|\| - данные blacklist от <a  class="text-blue-500" href="https://antifilter.download/" target="_blank">antifilter</a>
        <br>|\| - сайт от <a class="text-blue-500" href="https://github.com/qweme32" target="_blank">@qweme32</a>
      </div>
    </div>
  </div>
</template>