<template>
  <div class="text-[14px] flex-col space-y-2">
    <Header></Header>
    <div class="flex">
      <Sider />
      <div class="grow"><JsonDiff></JsonDiff></div>
    </div>
    <Footer></Footer>
  </div>
</template>

<script setup lang="ts">
import Footer from "./layout/Footer.vue";
import Header from "./layout/Header.vue";
import Sider from "./layout/Sider.vue";
import JsonDiff from "./components/JsonDiff.vue";
</script>
