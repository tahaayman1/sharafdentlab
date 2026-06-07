const endpoint = "https://nyc.cloud.appwrite.io/v1";
const projectId = "6a1d95ab0022f6a8cb34";
const apiKey = "standard_b73d088c92393e0922dc5fd1821325fe294dae4a15b1c7e6114677a82ec420cf3f02b0bfa0fdc81b081faa3b1da4ae88d690c7e1a2ebb474ecbd5b6069bab1b04410ab092d03bc5dc0fd2a460a015c3d2588acadd3709fa325b00771598e477032a0e4591f5b633d43057e043d53d63f2e817252f24452d3d080106e3b209ec2";

const headers = {
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Key": apiKey,
    "Content-Type": "application/json"
};

const schema = {
    site_settings: [
        { key: "siteName", type: "string", size: 255 },
        { key: "phone", type: "string", size: 255 },
        { key: "whatsapp", type: "string", size: 255 },
        { key: "email", type: "string", size: 255 },
        { key: "seoTitle", type: "string", size: 500 },
        { key: "seoDescription", type: "string", size: 2000 },
        { key: "footerText", type: "string", size: 1000 },
        { key: "defaultTheme", type: "string", size: 50 },
        { key: "showThemeSwitcher", type: "boolean" },
        { key: "logoImageId", type: "string", size: 255 },
        { key: "faviconImageId", type: "string", size: 255 },
        { key: "metaImageId", type: "string", size: 255 },
        { key: "facebookUrl", type: "string", size: 500 },
        { key: "instagramUrl", type: "string", size: 500 },
        { key: "address", type: "string", size: 1000 },
        { key: "heroImageId", type: "string", size: 255 },
        { key: "aboutImageId", type: "string", size: 255 }
    ],
    services: [
        { key: "title", type: "string", size: 255 },
        { key: "slug", type: "string", size: 255 },
        { key: "shortDescription", type: "string", size: 1000 },
        { key: "fullDescription", type: "string", size: 5000 },
        { key: "icon", type: "string", size: 50 },
        { key: "order", type: "integer" },
        { key: "isFeatured", type: "boolean" },
        { key: "isPublished", type: "boolean" },
        { key: "seoTitle", type: "string", size: 500 },
        { key: "seoDescription", type: "string", size: 2000 },
        { key: "imageId", type: "string", size: 255 }
    ],
    cases: [
        { key: "title", type: "string", size: 255 },
        { key: "slug", type: "string", size: 255 },
        { key: "category", type: "string", size: 100 },
        { key: "shortDescription", type: "string", size: 1000 },
        { key: "fullDescription", type: "string", size: 5000 },
        { key: "mainImageId", type: "string", size: 255 },
        { key: "beforeImageId", type: "string", size: 255 },
        { key: "afterImageId", type: "string", size: 255 },
        { key: "galleryImageIds", type: "string", size: 5000, array: true },
        { key: "order", type: "integer" },
        { key: "isFeatured", type: "boolean" },
        { key: "isPublished", type: "boolean" },
        { key: "seoTitle", type: "string", size: 500 },
        { key: "seoDescription", type: "string", size: 2000 }
    ],
    contact_messages: [
        { key: "name", type: "string", size: 255 },
        { key: "clinicName", type: "string", size: 255 },
        { key: "phone", type: "string", size: 255 },
        { key: "email", type: "string", size: 255 },
        { key: "serviceType", type: "string", size: 255 },
        { key: "message", type: "string", size: 5000 },
        { key: "uploadedFileId", type: "string", size: 255 },
        { key: "status", type: "string", size: 50 }
    ],
    why_us: [
        { key: "title", type: "string", size: 255 },
        { key: "description", type: "string", size: 1000 },
        { key: "icon", type: "string", size: 50 },
        { key: "order", type: "integer" },
        { key: "isPublished", type: "boolean" }
    ]
};

// Delay utility to avoid rate limits
const delay = ms => new Promise(res => setTimeout(res, ms));

async function createAttributes() {
    console.log("Synchronizing Appwrite Schemas...");
    
    for (const [colId, attributes] of Object.entries(schema)) {
        console.log(`\nChecking collection: ${colId}`);
        for (const attr of attributes) {
            const body = {
                key: attr.key,
                required: false,
                array: attr.array || false
            };
            if (attr.type === "string") body.size = attr.size || 255;
            
            const url = `${endpoint}/databases/main-db/collections/${colId}/attributes/${attr.type}`;
            
            const res = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body)
            });
            
            const data = await res.json();
            if (data.code === 409) {
                console.log(`  - [OK] ${attr.key} already exists.`);
            } else if (data.code >= 400) {
                console.error(`  - [FAIL] ${attr.key}:`, data.message || data);
            } else {
                console.log(`  - [CREATED] ${attr.key} successfully!`);
            }
            await delay(200); // 200ms delay between attributes
        }
    }
}

createAttributes().then(() => console.log("\nAll schemas synced!")).catch(console.error);
