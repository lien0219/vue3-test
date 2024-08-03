import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/home/index.vue";
import numberPeople from "../views/numberPeople/index.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/numberPeople",
    name: "numberPeople",
    component: numberPeople,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
