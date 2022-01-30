<template>
  <n-layout>
    <Header></Header>
    <div class="flex">
      <Sider />
      <div class="grow"><JsonDiff></JsonDiff></div>
      <Sider />
    </div>
    <Footer></Footer>
  </n-layout>
</template>

<script setup lang="ts">
import Footer from "./layout/Footer.vue";
import Header from "./layout/Header.vue";
import Sider from "./layout/Sider.vue";
import JsonDiff from "./components/JsonDiff.vue";
</script>
