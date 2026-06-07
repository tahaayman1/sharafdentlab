const endpoint = "https://nyc.cloud.appwrite.io/v1";
const projectId = "6a1d95ab0022f6a8cb34";
const apiKey = "standard_b73d088c92393e0922dc5fd1821325fe294dae4a15b1c7e6114677a82ec420cf3f02b0bfa0fdc81b081faa3b1da4ae88d690c7e1a2ebb474ecbd5b6069bab1b04410ab092d03bc5dc0fd2a460a015c3d2588acadd3709fa325b00771598e477032a0e4591f5b633d43057e043d53d63f2e817252f24452d3d080106e3b209ec2";

const headers = {
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Key": apiKey,
    "Content-Type": "application/json"
};

async function fixAppwrite() {
    console.log("Fixing Appwrite Bucket Permissions...");
    
    // First, let's get the current bucket configuration so we don't overwrite other settings like maxFileSize
    let bucketRes = await fetch(`${endpoint}/storage/buckets/website-media`, { headers });
    let bucketData = await bucketRes.json();
    
    if (bucketData.code >= 400) {
        console.error("Error fetching bucket:", bucketData);
    } else {
        // Update permissions to allow 'users' to create/update/delete, and 'any' to read
        const updateBody = {
            name: bucketData.name || "Website Media",
            permissions: [
                'read("any")',
                'create("users")',
                'update("users")',
                'delete("users")'
            ],
            fileSecurity: bucketData.fileSecurity || false,
            enabled: bucketData.enabled !== undefined ? bucketData.enabled : true,
            maximumFileSize: bucketData.maximumFileSize || 50000000,
            allowedFileExtensions: bucketData.allowedFileExtensions || [],
            compression: bucketData.compression || "none",
            encryption: bucketData.encryption || false,
            antivirus: bucketData.antivirus || false
        };

        const updateRes = await fetch(`${endpoint}/storage/buckets/website-media`, {
            method: "PUT",
            headers,
            body: JSON.stringify(updateBody)
        });
        const updateData = await updateRes.json();
        if (updateData.code >= 400) {
            console.error("Error updating bucket:", updateData);
        } else {
            console.log("✅ Bucket permissions updated successfully!");
        }
    }

    console.log("\nAdding missing attributes to site_settings collection...");
    const attributes = ["heroImageId", "aboutImageId"];
    
    for (const attr of attributes) {
        const body = {
            key: attr,
            size: 500,
            required: false
        };

        const res = await fetch(`${endpoint}/databases/main-db/collections/site_settings/attributes/string`, {
            method: "POST",
            headers,
            body: JSON.stringify(body)
        });
        
        const data = await res.json();
        // 409 means it already exists, which is fine
        if (data.code === 409) {
            console.log(`✅ Attribute '${attr}' already exists.`);
        } else if (data.code >= 400) {
            console.error(`Error creating attribute '${attr}':`, data.message || data);
        } else {
            console.log(`✅ Attribute '${attr}' created successfully!`);
        }
    }
}

fixAppwrite().then(() => console.log("\nDone!")).catch(console.error);
