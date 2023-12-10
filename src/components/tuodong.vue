<template>
  <button @click="submit">提交数据</button>
  <div class="drag-box">
    <Draggable
      v-model="tags"
      :list="list"
      :animation="100"
      item-key="id"
      class="list-group"
      :forceFallback="true"
      ghost-class="ghost"
      @change="onMoveCallback"
      :move="getdata"
    >
      <template #item="{ element }">
        <div class="items">
          <div class="title">{{ element.label }}</div>
        </div>
      </template>
    </Draggable>
  </div>
</template>

<script setup>
import Draggable from "vuedraggable";
import { reactive, watch } from "vue";

let list = reactive([
  {
    label: "模块1",
    id: 1,
    isflod: false,
  },
  {
    label: "模块2",
    id: 2,
    isflod: false,
  },
  {
    label: "模块3",
    id: 3,
    isflod: false,
  },
  {
    label: "模块4",
    id: 4,
    isflod: false,
  },
  {
    label: "模块5",
    id: 5,
    isflod: false,
  },
  {
    label: "模块6",
    id: 6,
    isflod: false,
  },
]);
const onMoveCallback = (val) => {
  console.log("拖动前的索引 :" + val.moved.newIndex);
  console.log("拖动后的索引 :" + val.moved.oldIndex);
};
const getdata = (val) => {
  console.log(val.draggedContext.element.id);
};
// 查看最新的数据
const submit = () => {
  console.log(list);
};
watch(
  () => list,
  (newValue, oldValue) => {
    console.log("list", newValue, oldValue);
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.drag-box .items {
  display: flex;
  justify-content: space-between;
  width: 80%;
  padding: 20px;
  margin-bottom: 20px;
  background: #e3e3e3;
  border-radius: 8px;
}
</style>
