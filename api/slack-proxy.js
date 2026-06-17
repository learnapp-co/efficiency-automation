// Vercel serverless function to proxy Slack webhook requests
// This bypasses CORS issues when sending Slack messages from the browser

async function uploadImageToSlack(imageData, messageText, mimeType = 'image/png') {
    const token = process.env.SLACK_BOT_TOKEN;
    const channel = process.env.SLACK_CHANNEL_ID;
    if (!token || !channel) {
        return null;
    }

    const buffer = Buffer.from(imageData, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: mimeType }), 'efficiency-chart.png');
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

async function uploadWithFormData(url, formData, label) {
    const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
            'User-Agent': 'efficiency-automation/1.0'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.log(`⚠️ ${label} upload failed:`, response.status, errorText.slice(0, 200));
        return null;
    }

    return response;
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

async function uploadImageTo0x0(imageData, mimeType = 'image/png') {
    const buffer = Buffer.from(imageData, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: mimeType }), 'efficiency-chart.png');

    const response = await uploadWithFormData('https://0x0.st', formData, '0x0.st');
    if (!response) {
        return null;
    }

    const imageUrl = (await response.text()).trim();
    if (imageUrl.startsWith('https://')) {
        console.log('✅ Image uploaded to 0x0.st:', imageUrl);
        return imageUrl;
    }

    console.log('⚠️ 0x0.st returned unexpected response:', imageUrl.slice(0, 200));
    return null;
}

async function uploadImageToFreeimage(imageData) {
    const apiKey = process.env.FREEIMAGE_API_KEY || '6d207e02198a847aa98d0a2a901485a5';
    const response = await fetch('https://freeimage.host/api/1/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `key=${apiKey}&source=${encodeURIComponent(imageData)}&format=json`
    });

    if (!response.ok) {
        console.log('⚠️ freeimage.host upload failed:', response.status);
        return null;
    }

    const result = await response.json();
    const imageUrl = result?.image?.display_url || result?.image?.url;
    if (result.status_code === 200 && imageUrl) {
        console.log('✅ Image uploaded to freeimage.host:', imageUrl);
        return imageUrl;
    }

    console.log('⚠️ freeimage.host returned unexpected response:', result);
    return null;
}

async function resolvePublicImageUrl(imageData, mimeType = 'image/png') {
    const uploaders = [
        (data) => uploadImageToImgbb(data),
        (data) => uploadImageTo0x0(data, mimeType),
        (data) => uploadImageToFreeimage(data)
    ];

    for (const upload of uploaders) {
        try {
            const imageUrl = await upload(imageData);
            if (imageUrl) {
                return imageUrl;
            }
        } catch (error) {
            console.error('❌ Image upload attempt failed:', error.message);
        }
    }

    return null;
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
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed. This endpoint only accepts POST requests.'
        });
    }

    try {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        const { messageData, imageUrl, imageData, imageMimeType } = req.body;

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

        if (imageData) {
            const slackUpload = await uploadImageToSlack(imageData, messageData.text, imageMimeType || 'image/png');
            if (slackUpload) {
                return res.status(200).json({
                    success: true,
                    message: 'Message and image sent to Slack successfully'
                });
            }
        }

        let resolvedImageUrl = imageUrl || null;

        if (!resolvedImageUrl && imageData) {
            console.log('📤 Uploading base64 image to public host...');
            resolvedImageUrl = await resolvePublicImageUrl(imageData, imageMimeType || 'image/png');
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
                message: 'Message sent to Slack successfully',
                imageUploaded: Boolean(resolvedImageUrl)
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
