const endpoint = "https://nyc.cloud.appwrite.io/v1";
const projectId = "6a1d95ab0022f6a8cb34";

async function testFetch() {
    const res = await fetch(`${endpoint}/databases/main-db/collections/site_settings/documents`, {
        headers: { "X-Appwrite-Project": projectId }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

testFetch().catch(console.error);
