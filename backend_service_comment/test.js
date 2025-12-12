const axios = require('axios');

async function testEndToEnd() {
    console.log('=== START END-TO-END TEST ===\n');

    const baseURL = 'http://localhost:8000';

    try {
        // Test 1: Normal comment (should auto-approve)
        console.log('Test 1: Creating normal comment...');
        const normalComment = await axios.post(`${baseURL}/comments`, {
            username: 'user1',
            content: 'Hello everyone, nice to meet you!'
        });
        console.log('✓ Normal comment created:');
        console.log(`  - ID: ${normalComment.data._id}`);
        console.log(`  - Status: ${normalComment.data.status}`);
        console.log(`  - Predicted: ${normalComment.data.predicted_label} (${(normalComment.data.confidence * 100).toFixed(1)}%)\n`);

        // Test 2: Spam comment (should be pending)
        console.log('Test 2: Creating spam comment...');
        const spamComment = await axios.post(`${baseURL}/comments`, {
            username: 'spammer',
            content: 'Click here for free spam products!'
        });
        console.log('✓ Spam comment created:');
        console.log(`  - ID: ${spamComment.data._id}`);
        console.log(`  - Status: ${spamComment.data.status}`);
        console.log(`  - Predicted: ${spamComment.data.predicted_label} (${(spamComment.data.confidence * 100).toFixed(1)}%)\n`);

        // Test 3: Hateful comment (should be pending)
        console.log('Test 3: Creating hateful comment...');
        const hatefulComment = await axios.post(`${baseURL}/comments`, {
            username: 'hater',
            content: 'I hate this community very much'
        });
        console.log('✓ Hateful comment created:');
        console.log(`  - ID: ${hatefulComment.data._id}`);
        console.log(`  - Status: ${hatefulComment.data.status}`);
        console.log(`  - Predicted: ${hatefulComment.data.predicted_label} (${(hatefulComment.data.confidence * 100).toFixed(1)}%)\n`);

        // Test 4: Get approved comments
        console.log('Test 4: Getting approved comments...');
        const approvedComments = await axios.get(`${baseURL}/comments?status=approved`);
        console.log(`✓ Found ${approvedComments.data.length} approved comment(s)\n`);

        // Test 5: Get pending comments
        console.log('Test 5: Getting pending comments...');
        const pendingComments = await axios.get(`${baseURL}/comments?status=pending`);
        console.log(`✓ Found ${pendingComments.data.length} pending comment(s)\n`);

        // Test 6: Approve a pending comment
        if (pendingComments.data.length > 0) {
            console.log('Test 6: Approving first pending comment...');
            const firstPending = pendingComments.data[0];
            const updated = await axios.put(`${baseURL}/comments/${firstPending._id}`, {
                status: 'approved'
            });
            console.log(`✓ Comment ${updated.data._id} approved\n`);
        }

        // Test 7: Delete a comment
        console.log('Test 7: Deleting spam comment...');
        await axios.delete(`${baseURL}/comments/${spamComment.data._id}`);
        console.log(`✓ Comment ${spamComment.data._id} deleted\n`);

        console.log('=== ALL TESTS PASSED ===');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

testEndToEnd();
