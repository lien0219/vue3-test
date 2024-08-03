<template>
  <div class="map" style="width: 100vw">
    <div id="mapBox" style="width: 100vw; height: 500px"></div>
  </div>
  <!-- <div class="form">
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
  </div> -->
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from "vue";

const props = defineProps({
  // jd: {
  //   type: String,
  //   default: "",
  // },
  // wd: {
  //   type: String,
  //   default: "",
  // },
  data: {
    type: Object,
    default: () => {},
  },
});

// const zuobiao = reactive({
//   jd: "",
//   wd: "",
// });
let map;
let form = ref({});
onMounted(() => {
  // nextTick(() => {
  // 创建地图实例
  // map = new window.BMap.Map("mapBox");
  // // 创建点坐标(可以使用百度地图拾取坐标系统获取指定的位置坐标)
  // // const point = new window.BMap.Point(116.404, 39.915);
  // const point = new window.BMap.Point(form.value.jd, form.value.wd);
  // // 初始化地图，设置中心点坐标和地图级别
  // map.centerAndZoom(point, 15);
  // // 启用滚轮缩放
  // map.enableScrollWheelZoom(true);
  // // 在地图上添加标注
  // const marker = new window.BMap.Marker(point);
  // map.addOverlay(marker);
  // // 移除默认中心点的标记
  // map.clearOverlays();
  // });
});
watch(props.data, (newValue, oldValue) => {
  form.value = newValue;
  console.log(form.value, "1111");
  map = new window.BMap.Map("mapBox");
  // 创建点坐标(可以使用百度地图拾取坐标系统获取指定的位置坐标)
  // const point = new window.BMap.Point(116.404, 39.915);
  const point = new window.BMap.Point(form.value.jd, form.value.wd);
  // 初始化地图，设置中心点坐标和地图级别
  map.centerAndZoom(point, 15);
  // 启用滚轮缩放
  map.enableScrollWheelZoom(true);
  // 在地图上添加标注
  const marker = new window.BMap.Marker(point);
  map.addOverlay(marker);
  // 移除默认中心点的标记
  map.clearOverlays();
});
// 查询
// const query = async () => {
//   await form.value.validate();
//   const { jd, wd } = zuobiao;
//   if (jd && wd) {
//     const point = new window.BMap.Point(jd, wd);
//     map.centerAndZoom(point, 15);
//     // map.centerAndZoom(point, 15);
//     const marker = new window.BMap.Marker(point);
//     // const marker = new window.BMap.Marker(point);
//     map.clearOverlays();
//     map.addOverlay(marker);
//   }
//   setTimeout(() => {
//     form.value.clearValidate("jd", "wd");
//   }, 1000);
// };
// 表单校验
// const jd = (rule, value, callBack) => {
//   value = value.trim();
//   if (/^[0-9]+(\.[0-9]+)?$/.test(value)) {
//     callBack();
//   } else {
//     callBack(new Error("请输入正确的经度！"));
//   }
// };
// const wd = (rule, value, callBack) => {
//   value = value.trim();
//   if (/^[0-9]+(\.[0-9]+)?$/.test(value)) {
//     callBack();
//   } else {
//     callBack(new Error("请输入正确的纬度！"));
//   }
// };
// const rules = {
//   jd: [{ required: true, validator: jd, trigger: "change" }],
//   wd: [{ required: true, validator: wd, trigger: "change" }],
// };
</script>

<style lang="scss" scoped>
.map {
  width: 800px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  background-color: bisque;
}
</style>
