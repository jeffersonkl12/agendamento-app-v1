import { useRequestState } from "@composables/useRequestState";
import { type Customer, listCustomers, updateCustomer } from "@services/customer";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useCustomerStore = defineStore("customer", () => {
	const customers = ref<Customer[]>([]);
	const { isLoading, error, run } = useRequestState();

	const customerById = computed(() => {
		const map = new Map<string, Customer>();
		for (const customer of customers.value) {
			map.set(customer.id, customer);
		}
		return map;
	});

	async function fetchCustomers() {
		const result = await run(() => listCustomers());
		if (result) customers.value = result;
		return result;
	}

	async function renameCustomer(id: string, name: string) {
		const result = await run(() => updateCustomer(id, name));
		if (result) {
			const index = customers.value.findIndex((customer) => customer.id === id);
			if (index !== -1) customers.value[index] = result;
		}
		return result;
	}

	return { customers, isLoading, error, customerById, fetchCustomers, renameCustomer };
});
