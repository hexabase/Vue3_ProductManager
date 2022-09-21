<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance } from "element-plus";
import { useHexabaseClient } from "../stores/hexabase";
const { hexabase, setToken } = useHexabaseClient();

// Form object
const ruleFormRef = ref<FormInstance>();
// Validation input value
const inputRequired = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error("Please input this field"));
  } else {
    callback();
  }
};
// Input values
const ruleForm = reactive({
  email: "",
  password: "",
});

// Validation rules
const rule = [{ validator: inputRequired, trigger: "blur" }];
const rules = reactive({
  email: rule,
  password: rule,
});

/**
 * Authentification
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
    // Login execute
    const { token, error } = await hexabase.auth.login({ ...ruleForm });
    // if there is an error, outpur error message.
    if (error) {
      console.log(error);
      return;
    }
    // if there is no error, set token to store.
    setToken(token!);
  } catch (e) {
    console.log("There is an error for input form.");
  }
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
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header>Authentification</el-header>
      <el-main>
        <el-form
          ref="ruleFormRef"
          :model="ruleForm"
          status-icon
          :rules="rules"
          label-width="120px"
        >
          <el-form-item label="Email address" prop="email">
            <el-input
              v-model="ruleForm.email"
              type="email"
              autocomplete="off"
            />
          </el-form-item>
          <el-form-item label="Password" prop="password">
            <el-input
              v-model="ruleForm.password"
              type="password"
              autocomplete="off"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm(ruleFormRef)">
              Login
            </el-button>
            <el-button @click="resetForm(ruleFormRef)">Reset</el-button>
          </el-form-item>
        </el-form>
      </el-main>
    </el-container>
  </div>
</template>
