const endpoint = "https://nyc.cloud.appwrite.io/v1";
const projectId = "6a1d95ab0022f6a8cb34";
const fileId = "6a1db85fd91cb35d8758";

async function testImage() {
    const url = `${endpoint}/storage/buckets/website-media/files/${fileId}/view?project=${projectId}`;
    console.log("Fetching:", url);
    const res = await fetch(url);
    console.log("Status:", res.status, res.statusText);
    const text = await res.text();
    if (res.status >= 400) {
        console.log("Response:", text);
    } else {
        console.log("Image loaded successfully. Content-Type:", res.headers.get("content-type"));
    }
}

testImage().catch(console.error);
