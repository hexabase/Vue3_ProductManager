<script setup lang="ts">
import { reactive, ref } from "vue";
import config from "../assets/config.json";

import type { FormInstance } from "element-plus";
import { useHexabaseClient } from "../stores/hexabase";

import { useRouter, useRoute } from "vue-router";
import * as dayjs from "dayjs";

// Get methods and object from store
const { hexabase, addProducts, findProduct, updateProduct, removeProduct } =
  useHexabaseClient();
// For routing
const router = useRouter();
const route = useRoute();
// Form object
const ruleFormRef = ref<FormInstance>();

/**
 * Validation text input
 */
const textRequired = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error("Please input this field"));
  } else {
    callback();
  }
};

/**
 * Validation number
 */
const numberRequired = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error("Please input this field"));
  } else if (isNaN(value)) {
    callback(new Error("Please input number"));
  } else {
    callback();
  }
};
/**
 * Validation date
 */
const dateRequired = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error("Please input this field"));
  } else if (isNaN(Date.parse(value))) {
    callback(new Error("Please input date"));
  } else {
    callback();
  }
};

/**
 * Initializate form data
 * If there is a product id in the route, return default values
 */
const initProduct = async (id: string | string[] | undefined) => {
  if (!id) {
    // New product
    return {
      name: "",
      price: 0,
      salesDate: "",
      detail: "",
    };
  } else {
    // Find out product from store
    const params = await findProduct(id as string);
    // Return form values. Sales date is formatted to date input format
    return {
      ...params,
      ...{ salesDate: dayjs(params!.salesDate).format("YYYY-MM-DD") },
    };
  }
};
// Input values
const ruleForm = reactive(await initProduct(route.params.id));
// For message
const message = ref({
  type: "",
  title: "",
});
// The flag that detects add or update
const isNew = route.params.id === undefined;

// Validation rules
const ruleText = [{ validator: textRequired, trigger: "blur" }];
const ruleNumber = [{ validator: numberRequired, trigger: "blur" }];
const ruleDate = [{ validator: dateRequired, trigger: "blur" }];
const rules = reactive({
  name: ruleText,
  price: ruleNumber,
  salesDate: ruleDate,
  detail: ruleText,
});

/**
 * Register and update product event handler
 */
const submitForm = async (formEl: FormInstance | undefined) => {
  // if there is no form element, finish.
  if (!formEl) return;
  try {
    // Validate form
    await new Promise((res, rej) => {
      formEl.validate((valid) => {
        valid ? res(valid) : rej();
      });
    });
    // Separate method for register and update
    if (route.params.id) {
      // Update product
      await update();
    } else {
      // Add product
      await add();
    }
  } catch (e) {
    showMessage("error", e as string, 10000);
  }
};

/**
 * Show message and hide after timeout
 */
const showMessage = (type: string, title: string, timeout: number = 3000) => {
  message.value = { type, title };
  setTimeout(() => (message.value.title = ""), timeout);
};

/**
 * Update product in Hexabase datastore
 */
const update = async () => {
  // Generate update parameters
  const params = {
    name: ruleForm.name,
    price: Number(ruleForm.price),
    salesDate: ruleForm.salesDate,
    detail: ruleForm.detail,
  };
  // Update product
  const { data, error } = await hexabase.items.update(
    config.applicationId,
    config.datastoreId,
    route.params.id as string,
    { item: params, return_item_result: true, rev_no: Number(ruleForm.rev_no) }
  );
  // If there is error, show error message
  if (error) {
    return showMessage("error", error as string, 10000);
  }
  // Update item revision number
  ruleForm.rev_no = data!.item.rev_no;
  // Update store
  updateProduct(data.i_id, data.item);
  // Show success message
  return showMessage("success", "Update successful.");
};

/**
 * Add product to Hexabase
 */
const add = async () => {
  // Create item
  const { itemNew, error } = await hexabase.items.create(
    config.applicationId,
    config.datastoreId,
    {
      item: ruleForm,
      return_item_result: true,
    }
  );
  // If error, show error message
  if (error) {
    return showMessage("error", error, 10000);
  }
  // Add product to store
  addProducts([itemNew!.item]);
  // Redirect to product edit page
  router.push(`/edit/${itemNew!.item_id}`);
};

/**
 * Delete product
 */
const deleteProduct = async () => {
  // Delete product
  const { error } = await hexabase.items.delete(
    config.applicationId,
    config.datastoreId,
    route.params.id as string,
    { a_id: ruleForm.p_id! }
  );
  // If error, show error message
  if (error) {
    return showMessage("error", error as string, 10000);
  }
  // Delete product from store
  removeProduct(route.params.id as string);
  // Redirect to product list page
  router.push("/");
};

/**
 * Reset form
 */
const resetForm = (formEl: FormInstance | undefined) => {
  // if there is no form element, finish.
  if (!formEl) return;
  // Reset form
  formEl.resetFields();
};

/**
 * Back to list page
 */
const onBack = () => {
  router.back();
};
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <el-page-header @back="onBack">
          <template #content>{{
            isNew ? "New Product" : "Update Product"
          }}</template>
        </el-page-header>
      </el-header>
      <el-main>
        <div v-if="message.title !== ''">
          <el-alert :title="message.title" :type="message.type" />
        </div>
        <el-form
          ref="ruleFormRef"
          :model="ruleForm"
          status-icon
          :rules="rules"
          label-width="120px"
        >
          <el-form-item label="Product name" prop="name">
            <el-input v-model="ruleForm.name" type="email" autocomplete="off" />
          </el-form-item>
          <el-form-item label="Price" prop="price">
            <el-input
              v-model="ruleForm.price"
              type="number"
              autocomplete="off"
            />
          </el-form-item>
          <el-form-item label="Sales date" prop="salesDate">
            <el-input
              v-model="ruleForm.salesDate"
              type="date"
              autocomplete="off"
            />
          </el-form-item>
          <el-form-item label="Detail" prop="detail">
            <el-input
              v-model="ruleForm.detail"
              type="textarea"
              autocomplete="off"
            />
          </el-form-item>
          <el-row>
            <el-col :span="24">
              <el-form-item>
                <el-button type="primary" @click="submitForm(ruleFormRef)">
                  Save product
                </el-button>
                <el-button @click="resetForm(ruleFormRef)">Reset</el-button>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item>
                <el-button type="danger" @click="deleteProduct">
                  Delete product
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-main>
    </el-container>
  </div>
</template>
