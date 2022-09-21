<script setup lang="ts">
import LoginForm from "../components/LoginForm.vue";
import ProductList from "../components/ProductList.vue";
import { useHexabaseClient } from "../stores/hexabase";
import { storeToRefs } from "pinia";
const store = useHexabaseClient();
const { hexabase } = storeToRefs(store);
</script>

<template>
  <main>
    <Suspense>
      <!-- if user logged in, show product list -->
      <div v-if="hexabase.isLogin()">
        <ProductList />
      </div>
      <!-- if user does not logged in, show login form -->
      <div v-else>
        <LoginForm />
      </div>
    </Suspense>
  </main>
</template>
