import { useRequestState } from "@composables/useRequestState";
import {
	type CreateCustomerInput,
	type Customer,
	createCustomer,
	deleteCustomer,
	listCustomers,
	type UpdateCustomerInput,
	updateCustomer,
} from "@services/customer";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useCustomerStore = defineStore("customer", () => {
	const customers = ref<Customer[]>([]);
	const hasLoaded = ref(false);
	const { isLoading, error, errorStatus, run } = useRequestState();

	const customerById = computed(() => {
		const map = new Map<string, Customer>();
		for (const customer of customers.value) {
			map.set(customer.id, customer);
		}
		return map;
	});

	async function fetchCustomers() {
		const result = await run(() => listCustomers());
		if (result) {
			customers.value = result;
			hasLoaded.value = true;
		}
		return result;
	}

	async function addCustomer(input: CreateCustomerInput) {
		const result = await run(() => createCustomer(input));
		if (result) customers.value = [result, ...customers.value];
		return result;
	}

	async function editCustomer(id: string, input: UpdateCustomerInput) {
		const result = await run(() => updateCustomer(id, input));
		if (result) {
			const index = customers.value.findIndex((customer) => customer.id === id);
			if (index !== -1) customers.value[index] = result;
		}
		return result;
	}

	async function removeCustomer(id: string) {
		let succeeded = false;
		await run(async () => {
			await deleteCustomer(id);
			succeeded = true;
		});
		if (succeeded) customers.value = customers.value.filter((customer) => customer.id !== id);
		return succeeded;
	}

	return {
		customers,
		hasLoaded,
		isLoading,
		error,
		errorStatus,
		customerById,
		fetchCustomers,
		addCustomer,
		editCustomer,
		removeCustomer,
	};
});
