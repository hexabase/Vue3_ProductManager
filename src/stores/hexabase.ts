import { ref } from "vue";
import { defineStore } from "pinia";
import { HexabaseClient } from "@hexabase/hexabase-js";
import type { DsItem } from "@hexabase/hexabase-js/dist/lib/types/item";
import config from "../assets/config.json";

// Token name for localStorage
const tokenName = "hexabaseToken";
// Get token from localStorage
const token = localStorage.getItem(tokenName);
// GraphQL endpoint
const url = "https://graphql.hexabase.com/graphql";

// Product interface. It's extended by default DsItem interface
interface DsProduct extends DsItem {
  name: string;
  price: number;
  detail: string;
  salesDate: string;
}

export const useHexabaseClient = defineStore("hexabase", () => {
  // Create a new HexabaseClient
  const hexabase = ref(new HexabaseClient(url, token || undefined));
  // List of Product
  const ary: DsProduct[] = [];
  const products = ref(ary);

  // Call this method when user logged in
  const setToken = ref((token: string) => {
    // Set token to HexabaseClient
    hexabase.value.setToken(token!);
    // Save token to localStorage
    localStorage.setItem(tokenName, token!);
  });

  /**
   * Add product to store
   */
  const addProducts = ref((ps: DsProduct[]) => {
    products.value = [...products.value, ...ps];
  });

  /**
   * Get products from Hexabase
   */
  const getProducts = ref(async () => {
    // Get all fields from Hexabase
    const res = await hexabase.value.datastores.getFields(
      config.applicationId,
      config.datastoreId
    );
    const { fields } = res;
    // Get products from Hexabase
    const { dsItems, error } = await hexabase.value.items.get(
      {
        per_page: 0,
        page: 1,
      },
      config.datastoreId,
      config.applicationId
    );
    // if there is an error, output error message.
    if (error) {
      console.log(error);
      return;
    }
    // if there is no error, set product list to reactive object.
    products.value = dsItems!.items.map((item) => {
      Object.keys(item).forEach((field) => {
        if (field in fields!) {
          item[fields![field].display_id] = item[field];
          delete item[field];
        } else {
          return field;
        }
      });
      return item as DsProduct;
    });
  });

  /**
   * Find product by i_id
   * If there is no product, get all products from Hexabase datastore.
   */
  const findProduct = ref(async (i_id: string) => {
    // If there is no product, get all products from Hexabase datastore.
    if (products.value.length === 0) {
      await getProducts.value();
    }
    // Find product by i_id
    return products.value.find((p) => p.i_id === i_id);
  });

  /**
   * Replace product by i_id
   */
  const updateProduct = ref((i_id: string, product: DsProduct) => {
    const index = products.value.findIndex((p) => p.i_id === i_id);
    products.value[index] = product;
  });

  /**
   * Remove product by i_id
   */
  const removeProduct = ref((i_id: string) => {
    const index = products.value.findIndex((p) => p.i_id === i_id);
    products.value.splice(index, 1);
  });
  
  return {
    hexabase,
    setToken,
    addProducts,
    getProducts,
    findProduct,
    updateProduct,
    removeProduct,
    products,
  };
});
