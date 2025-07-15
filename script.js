document.addEventListener('DOMContentLoaded', () => {
    const uncleanJsonTextarea = document.getElementById('uncleanJson');
    const cleanJsonTextarea = document.getElementById('cleanJson');
    const parseButton = document.getElementById('parseButton');

    // Function to clean and format JSON
    function cleanAndFormatJson(rawJsonString) {
        let parsed;
        try {
            // Step 1: Parse the main JSON
            parsed = JSON.parse(rawJsonString);
        } catch (err) {
            throw new Error(`Invalid JSON input: ${err.message}`);
        }

        // Step 2: Check if 'data.updated.updated' is a stringified array
        if (
            parsed?.data?.updated?.updated &&
            typeof parsed.data.updated.updated === 'string'
        ) {
            try {
                parsed.data.updated.updated = JSON.parse(parsed.data.updated.updated);
            } catch (e) {
                console.warn("⚠️ Could not parse 'data.updated.updated', keeping as string. Error:", e.message);
                // If it fails, we keep it as a string and proceed
            }

            // Step 3: For each invoice, parse the 'attachment' field if it's a string
            if (Array.isArray(parsed.data.updated.updated)) {
                parsed.data.updated.updated.forEach((item) => {
                    const attachment = item?.invoice?.attachment;
                    if (attachment && typeof attachment === 'string') {
                        try {
                            item.invoice.attachment = JSON.parse(attachment);
                        } catch (err) {
                            console.warn(`⚠️ Could not parse attachment for invoice: ${item.invoice?.name || 'unknown'}. Error: ${err.message}`);
                        }
                    }
                });
            }
        }

        // Step 4: Return clean, formatted JSON string
        return JSON.stringify(parsed, null, 2);
    }

    // Event listener for the button click
    parseButton.addEventListener('click', () => {
        const rawInput = uncleanJsonTextarea.value;
        cleanJsonTextarea.value = ''; // Clear previous output

        if (!rawInput.trim()) {
            cleanJsonTextarea.value = 'Please paste some JSON into the left editor.';
            return;
        }

        try {
            const cleanedOutput = cleanAndFormatJson(rawInput);
            cleanJsonTextarea.value = cleanedOutput;
        } catch (error) {
            cleanJsonTextarea.value = `Error: ${error.message}nPlease check your input JSON.`;
            console.error("❌ JSON Cleaning Error:", error);
        }
    });
});
