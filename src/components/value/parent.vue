<template>
  <div>
    <h1>子组件</h1>
    <child ref="childComponentRef"></child>
  </div>
  <div class="parent">
    父组件
    <button @click="getInputValue">获取list</button>
  </div>
</template>

<script setup>
import child from "./child.vue";
import { ref } from "vue";

const childComponentRef = ref(null);

const getInputValue = () => {
  const childComponent = childComponentRef.value;
  // const childList = childComponent.list;
  // const inputValues = childList.map((item) => item.inputValue);
  // console.log(inputValues);
  console.log(childComponent, "list");
};
</script>

<style lang="scss" scoped></style>
