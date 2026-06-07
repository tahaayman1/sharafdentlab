const endpoint = "https://nyc.cloud.appwrite.io/v1";
const projectId = "6a1d95ab0022f6a8cb34";
const apiKey = "standard_b73d088c92393e0922dc5fd1821325fe294dae4a15b1c7e6114677a82ec420cf3f02b0bfa0fdc81b081faa3b1da4ae88d690c7e1a2ebb474ecbd5b6069bab1b04410ab092d03bc5dc0fd2a460a015c3d2588acadd3709fa325b00771598e477032a0e4591f5b633d43057e043d53d63f2e817252f24452d3d080106e3b209ec2";

const headers = {
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Key": apiKey,
    "Content-Type": "application/json"
};

const collections = [
    "site_settings",
    "sections",
    "why_us",
    "services",
    "cases",
    "process_steps",
    "contact_messages"
];

async function fixDatabasePermissions() {
    console.log("Fixing Appwrite Collection Permissions...");
    
    for (const colId of collections) {
        let res = await fetch(`${endpoint}/databases/main-db/collections/${colId}`, { headers });
        let data = await res.json();
        
        if (data.code >= 400) {
            console.error(`Error fetching collection ${colId}:`, data);
            continue;
        }

        // We need to add 'read("any")' to permissions.
        // We'll also ensure 'create("users")', 'update("users")', 'delete("users")' are there
        const newPermissions = [
            'read("any")',
            'create("users")',
            'update("users")',
            'delete("users")'
        ];

        // For contact_messages, we might want 'create("any")' so guests can submit the form!
        if (colId === "contact_messages") {
            newPermissions.push('create("any")');
        }

        const updateBody = {
            name: data.name,
            permissions: newPermissions,
            documentSecurity: data.documentSecurity !== undefined ? data.documentSecurity : false,
            enabled: data.enabled !== undefined ? data.enabled : true
        };

        const updateRes = await fetch(`${endpoint}/databases/main-db/collections/${colId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(updateBody)
        });
        
        const updateData = await updateRes.json();
        if (updateData.code >= 400) {
            console.error(`Error updating collection ${colId}:`, updateData.message || updateData);
        } else {
            console.log(`✅ Collection '${colId}' permissions updated successfully!`);
        }
    }
}

fixDatabasePermissions().then(() => console.log("\nDone!")).catch(console.error);
