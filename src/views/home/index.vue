<template>
  <!-- 地图组件 -->
  <Map :data="zuobiao"></Map>
  <!-- 拖拽组件 -->
  <!-- <TuoDong></TuoDong> -->
  <!-- <Tuo></Tuo> -->
  <!-- 可删除添加的拖拽组件 -->
  <!-- <editDrag></editDrag> -->
  <!-- <parent></parent> -->
  <!-- <tab></tab> -->
  <div class="form">
    <el-form :rules="rules" :model="zuobiao" ref="form">
      <el-form-item prop="jd">
        <el-input
          v-model="zuobiao.jd"
          label="经度"
          placeholder="请输入经度"
        ></el-input>
      </el-form-item>
      <el-form-item prop="wd">
        <el-input
          v-model="zuobiao.wd"
          label="纬度"
          placeholder="请输入纬度"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="query">查询</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import Map from "../../components/map.vue";
import TuoDong from "../../components/tuodong.vue";
import Tuo from "../../components/tuodongtest.vue";
import editDrag from "../../components/editDrag.vue";
import parent from "../../components/value/parent.vue";
import tab from "../../components/tab/index.vue";
import { ref, watch } from "vue";

const zuobiao = ref({
  jd: "",
  wd: "",
});

watch(zuobiao.value, (n, o) => {
  Object.assign(zuobiao, n);
});

// 查询
const query = async () => {
  await form.value.validate();
  const { jd, wd } = zuobiao;
  if (jd && wd) {
    const point = new window.BMap.Point(jd, wd);
    map.centerAndZoom(point, 15);
    // map.centerAndZoom(point, 15);
    const marker = new window.BMap.Marker(point);
    // const marker = new window.BMap.Marker(point);
    map.clearOverlays();
    map.addOverlay(marker);
  }
  setTimeout(() => {
    form.value.clearValidate("jd", "wd");
  }, 1000);
};
// 表单校验
const jd = (rule, value, callBack) => {
  value = value.trim();
  if (/^[0-9]+(\.[0-9]+)?$/.test(value)) {
    callBack();
  } else {
    callBack(new Error("请输入正确的经度！"));
  }
};
const wd = (rule, value, callBack) => {
  value = value.trim();
  if (/^[0-9]+(\.[0-9]+)?$/.test(value)) {
    callBack();
  } else {
    callBack(new Error("请输入正确的纬度！"));
  }
};
const rules = {
  jd: [{ required: true, validator: jd, trigger: "change" }],
  wd: [{ required: true, validator: wd, trigger: "change" }],
};
</script>

<style lang="scss" scoped></style>
