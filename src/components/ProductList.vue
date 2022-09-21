<script setup lang="ts">
import { useHexabaseClient } from "../stores/hexabase";
import { Plus } from "@element-plus/icons-vue";
import { storeToRefs } from "pinia";

const { getProducts } = useHexabaseClient();
const { products } = storeToRefs(useHexabaseClient());

// Get products from Hexabase
getProducts();
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <el-row>
          <el-col :span="20">
            <h1>Product list</h1>
          </el-col>
          <el-col :span="4">
            <router-link to="/new">
              <el-button type="primary" :icon="Plus" :link="true" />
            </router-link>
          </el-col>
        </el-row>
      </el-header>
      <el-main>
        <div v-for="product in products" :key="product.d_id">
          <el-row>
            <el-col :span="24">
              <router-link :to="`/edit/${product.i_id}`">
                {{ product.title }}
              </router-link>
            </el-col>
          </el-row>
        </div>
      </el-main>
    </el-container>
  </div>
</template>
