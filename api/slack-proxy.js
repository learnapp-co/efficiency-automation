// Vercel serverless function to proxy Slack webhook requests
// This bypasses CORS issues when sending Slack messages from the browser

async function uploadImageToSlack(imageData, messageText) {
    const token = process.env.SLACK_BOT_TOKEN;
    const channel = process.env.SLACK_CHANNEL_ID;
    if (!token || !channel) {
        return null;
    }

    const buffer = Buffer.from(imageData, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: 'image/png' }), 'efficiency-chart.png');
    formData.append('channels', channel);
    formData.append('initial_comment', messageText);
    formData.append('title', 'Efficiency Report');

    const response = await fetch('https://slack.com/api/files.upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });

    const result = await response.json();
    if (result.ok) {
        console.log('✅ Image uploaded directly to Slack');
        return result.file?.permalink || 'slack-upload';
    }

    console.log('⚠️ Slack direct upload failed:', result.error);
    return null;
}

async function uploadImageToImgbb(imageData) {
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
        return null;
    }

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `image=${encodeURIComponent(imageData)}`
    });

    if (!response.ok) {
        return null;
    }

    const result = await response.json();
    if (result.success && result.data?.url) {
        console.log('✅ Image uploaded to imgbb:', result.data.url);
        return result.data.url;
    }

    return null;
}

async function uploadImageToCatbox(imageData) {
    const buffer = Buffer.from(imageData, 'base64');
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', new Blob([buffer], { type: 'image/png' }), 'efficiency-chart.png');

    const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        return null;
    }

    const imageUrl = (await response.text()).trim();
    if (imageUrl.startsWith('https://')) {
        console.log('✅ Image uploaded to catbox:', imageUrl);
        return imageUrl;
    }

    return null;
}

async function resolvePublicImageUrl(imageData) {
    return (
        await uploadImageToImgbb(imageData) ||
        await uploadImageToCatbox(imageData)
    );
}

function buildSlackPayload(messageData, imageUrl) {
    if (!imageUrl) {
        return { ...messageData };
    }

    return {
        ...messageData,
        blocks: [
            {
                type: 'section',
                text: { type: 'mrkdwn', text: messageData.text }
            },
            {
                type: 'image',
                image_url: imageUrl,
                alt_text: 'Efficiency report chart'
            }
        ]
    };
}

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed. This endpoint only accepts POST requests.'
        });
    }

    try {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        const { messageData, imageUrl, imageData } = req.body;

        if (!webhookUrl) {
            return res.status(500).json({
                error: 'Server configuration error: SLACK_WEBHOOK_URL not configured'
            });
        }

        if (!messageData) {
            return res.status(400).json({
                error: 'Missing required field: messageData'
            });
        }

        if (!webhookUrl.startsWith('https://hooks.slack.com/services/')) {
            return res.status(500).json({
                error: 'Invalid Slack webhook URL configuration'
            });
        }

        console.log('📤 Forwarding request to Slack webhook...');

        // Prefer uploading the chart directly to Slack when a bot token is configured
        if (imageData) {
            const slackUpload = await uploadImageToSlack(imageData, messageData.text);
            if (slackUpload) {
                return res.status(200).json({
                    success: true,
                    message: 'Message and image sent to Slack successfully'
                });
            }
        }

        let resolvedImageUrl = imageUrl || null;

        if (!resolvedImageUrl && imageData) {
            try {
                console.log('📤 Uploading base64 image to public host...');
                resolvedImageUrl = await resolvePublicImageUrl(imageData);
            } catch (uploadError) {
                console.error('❌ Error uploading image:', uploadError);
            }
        }

        const slackPayload = buildSlackPayload(messageData, resolvedImageUrl);
        if (!resolvedImageUrl && imageData) {
            slackPayload.text += '\n\n📊 Chart: [Image upload failed - check Company View for visual data]';
        }

        const slackResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(slackPayload)
        });

        if (slackResponse.ok) {
            console.log('✅ Message sent to Slack successfully');
            return res.status(200).json({
                success: true,
                message: 'Message sent to Slack successfully'
            });
        }

        console.error('❌ Slack API error:', slackResponse.status, slackResponse.statusText);
        const errorText = await slackResponse.text();
        return res.status(slackResponse.status).json({
            error: 'Slack API error',
            details: errorText || slackResponse.statusText
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}
