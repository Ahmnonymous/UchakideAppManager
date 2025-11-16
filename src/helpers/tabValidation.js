export async function validateTabsAndNavigate(options) {
	const {
		requiredFields,
		fieldTabMap,
		trigger,
		getValues,
		setActiveTab,
		showAlert,
		tabLabelMap = {},
	} = options;

	// Validate required fields across all tabs
	const isValid = await trigger(requiredFields, { shouldFocus: false });
	if (isValid) return true;

	// Collect missing fields
	const missing = [];
	for (const field of requiredFields) {
		const value = getValues(field);
		if (
			value === undefined ||
			value === null ||
			value === "" ||
			(typeof value === "string" && value.trim() === "")
		) {
			missing.push(field);
		}
	}

	if (missing.length === 0) return false;

	// Navigate to first tab with a missing field
	const firstMissingField = missing[0];
	const firstMissingTab = fieldTabMap[firstMissingField];
	if (firstMissingTab) setActiveTab(firstMissingTab);

	// Reuse existing alert pattern
	const tabName = tabLabelMap?.[firstMissingTab];
	const alertMessage = tabName
		? `Please complete the required fields in the ${tabName} tab.`
		: `Please fill required fields: ${missing.join(", ")}`;
	showAlert(alertMessage, "danger");

	// Scroll into view after tab switch
	setTimeout(() => {
		const el = document.getElementById(firstMissingField);
		if (el && typeof el.scrollIntoView === "function") {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
			if (typeof el.focus === "function") el.focus();
		}
	}, 100);

	return false;
}
