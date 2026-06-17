// Vercel serverless function to proxy Slack webhook requests
// This bypasses CORS issues when sending Slack messages from the browser

async function slackApi(method, token, body) {
    const response = await fetch(`https://slack.com/api/${method}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(body)
    });

    return response.json();
}

async function postSlackMessage(token, channel, messageData) {
    const result = await slackApi('chat.postMessage', token, {
        channel,
        text: messageData.text,
        username: messageData.username,
        icon_emoji: messageData.icon_emoji
    });

    if (result.ok) {
        console.log('✅ Message posted to Slack via bot');
        return { ok: true };
    }

    console.log('⚠️ chat.postMessage failed:', result.error);
    return { ok: false, error: result.error, step: 'chat.postMessage' };
}

async function uploadBinaryToSlackUrl(uploadUrl, buffer, filename, mimeType) {
    const formData = new FormData();
    formData.append('filename', filename);
    formData.append('file', new Blob([buffer], { type: mimeType }), filename);

    const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        return {
            ok: false,
            error: `${response.status} ${response.statusText}`,
            details: errorText.slice(0, 300),
            step: 'binary-upload'
        };
    }

    return { ok: true };
}

async function uploadImageToSlackLegacy(imageData, messageText, mimeType, token, channel) {
    const buffer = Buffer.from(imageData, 'base64');
    const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
    const filename = `efficiency-report.${extension}`;
    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: mimeType }), filename);
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
        console.log('✅ Image uploaded via legacy files.upload');
        return { ok: true, permalink: result.file?.permalink || 'slack-upload' };
    }

    return { ok: false, error: result.error, step: 'files.upload' };
}

async function uploadImageToSlack(imageData, messageText, mimeType = 'image/png') {
    const token = (process.env.SLACK_BOT_TOKEN || '').trim();
    const channel = (process.env.SLACK_CHANNEL_ID || '').trim();
    if (!token || !channel) {
        return { ok: false, error: 'missing_bot_config', step: 'config' };
    }

    const buffer = Buffer.from(imageData, 'base64');
    const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
    const filename = `efficiency-report.${extension}`;

    const uploadUrlResult = await slackApi('files.getUploadURLExternal', token, {
        filename,
        length: buffer.length
    });

    if (!uploadUrlResult.ok) {
        console.log('⚠️ files.getUploadURLExternal failed:', uploadUrlResult.error);
        const legacyResult = await uploadImageToSlackLegacy(imageData, messageText, mimeType, token, channel);
        return legacyResult;
    }

    const binaryUpload = await uploadBinaryToSlackUrl(
        uploadUrlResult.upload_url,
        buffer,
        filename,
        mimeType
    );

    if (!binaryUpload.ok) {
        console.log('⚠️ Slack binary upload failed:', binaryUpload.error, binaryUpload.details);
        const legacyResult = await uploadImageToSlackLegacy(imageData, messageText, mimeType, token, channel);
        return legacyResult;
    }

    const completeResult = await slackApi('files.completeUploadExternal', token, {
        files: [{
            id: uploadUrlResult.file_id,
            title: 'Efficiency Report'
        }],
        channel_id: channel,
        initial_comment: messageText
    });

    if (completeResult.ok) {
        console.log('✅ Image uploaded directly to Slack via bot');
        return {
            ok: true,
            permalink: completeResult.files?.[0]?.permalink || 'slack-upload'
        };
    }

    console.log('⚠️ files.completeUploadExternal failed:', completeResult.error);
    const legacyResult = await uploadImageToSlackLegacy(imageData, messageText, mimeType, token, channel);
    if (legacyResult.ok) {
        return legacyResult;
    }

    return {
        ok: false,
        error: completeResult.error || legacyResult.error || 'unknown_error',
        step: 'files.completeUploadExternal'
    };
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

async function sendViaWebhook(webhookUrl, slackPayload) {
    const slackResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackPayload)
    });

    if (!slackResponse.ok) {
        const errorText = await slackResponse.text();
        throw new Error(errorText || slackResponse.statusText);
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed. This endpoint only accepts POST requests.'
        });
    }

    try {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        const botToken = (process.env.SLACK_BOT_TOKEN || '').trim();
        const botChannel = (process.env.SLACK_CHANNEL_ID || '').trim();
        const { messageData, imageUrl, imageData, imageMimeType } = req.body;

        if (!messageData) {
            return res.status(400).json({
                error: 'Missing required field: messageData'
            });
        }

        if (!webhookUrl && !(botToken && botChannel)) {
            return res.status(500).json({
                error: 'Server configuration error: configure SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN + SLACK_CHANNEL_ID'
            });
        }

        if (webhookUrl && !webhookUrl.startsWith('https://hooks.slack.com/services/')) {
            return res.status(500).json({
                error: 'Invalid Slack webhook URL configuration'
            });
        }

        console.log('📤 Sending Slack report...', {
            hasBotToken: Boolean(botToken),
            botChannel,
            hasImage: Boolean(imageData),
            hasWebhook: Boolean(webhookUrl)
        });

        let botError = null;

        if (imageData && botToken && botChannel) {
            const slackUpload = await uploadImageToSlack(
                imageData,
                messageData.text,
                imageMimeType || 'image/png'
            );

            if (slackUpload.ok) {
                return res.status(200).json({
                    success: true,
                    message: 'Report image uploaded to Slack via bot',
                    delivery: 'slack-bot-file'
                });
            }

            botError = slackUpload;
            console.log('⚠️ Slack bot upload failed, falling back to webhook/image host:', slackUpload);
        }

        if (!imageData && botToken && botChannel) {
            const posted = await postSlackMessage(botToken, botChannel, messageData);
            if (posted.ok) {
                return res.status(200).json({
                    success: true,
                    message: 'Message sent to Slack via bot',
                    delivery: 'slack-bot-message'
                });
            }
            botError = posted;
        }

        if (!webhookUrl) {
            return res.status(500).json({
                error: 'Slack bot delivery failed and no webhook fallback is configured',
                botError
            });
        }

        let resolvedImageUrl = imageUrl || null;

        if (!resolvedImageUrl && imageData) {
            console.log('📤 Uploading base64 image to public host...');
            resolvedImageUrl = await resolvePublicImageUrl(imageData, imageMimeType || 'image/png');
        }

        const slackPayload = buildSlackPayload(messageData, resolvedImageUrl);
        if (!resolvedImageUrl && imageData) {
            const botHint = botError
                ? `Bot error (${botError.step}): ${botError.error}. Check bot is invited to channel ${botChannel} and has files:write scope.`
                : 'Image upload failed.';
            slackPayload.text += `\n\n📊 Chart: [${botHint}]`;
        }

        await sendViaWebhook(webhookUrl, slackPayload);

        return res.status(200).json({
            success: true,
            message: botError
                ? 'Sent via webhook fallback because bot upload failed'
                : 'Message sent to Slack successfully',
            imageUploaded: Boolean(resolvedImageUrl),
            delivery: resolvedImageUrl ? 'webhook-image-block' : 'webhook-text',
            botError
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}
