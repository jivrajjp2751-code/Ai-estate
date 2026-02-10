require('dotenv').config();
const apiKey = process.env.BOLNA_API_KEY;
const agentId = process.env.BOLNA_AGENT_ID;

console.log("API Key:", apiKey);
console.log("Agent ID:", agentId);

async function testCall() {
    try {
        const response = await fetch("https://api.bolna.dev/call", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                agent_id: agentId,
                recipient_phone_number: "+919421517187",
                user_data: {
                    customer_name: "Test User",
                    preferred_area: "Bandra",
                    budget: "5 Cr"
                }
            })
        });

        console.log("Status:", response.status);
        const data = await response.json();
        console.log("Full JSON Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

testCall();
