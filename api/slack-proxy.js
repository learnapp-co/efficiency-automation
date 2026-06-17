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

async function slackApiForm(method, token, params) {
    const body = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            body.append(key, String(value));
        }
    });

    const response = await fetch(`https://slack.com/api/${method}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        },
        body: body.toString()
    });

    return response.json();
}

async function postSlackMessage(token, channel, text) {
    const result = await slackApi('chat.postMessage', token, {
        channel,
        text,
        unfurl_links: false,
        unfurl_media: false
    });

    if (result.ok) {
        console.log('✅ Message posted to Slack via bot');
        return { ok: true };
    }

    console.log('⚠️ chat.postMessage failed:', result.error);
    return { ok: false, error: result.error, step: 'chat.postMessage' };
}

async function uploadImageViaExternalFlow(token, channel, buffer, filename, mimeType, messageText) {
    const fileLength = Math.floor(buffer.length);

    console.log('📤 Requesting Slack upload URL:', { filename, length: fileLength });

    const uploadUrlResult = await slackApiForm('files.getUploadURLExternal', token, {
        filename,
        length: fileLength
    });

    if (!uploadUrlResult.ok) {
        return {
            ok: false,
            error: uploadUrlResult.error,
            step: 'files.getUploadURLExternal',
            details: uploadUrlResult.response_metadata?.messages?.join(', ')
        };
    }

    const binaryUpload = await fetch(uploadUrlResult.upload_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream'
        },
        body: buffer
    });

    if (!binaryUpload.ok) {
        const errorText = await binaryUpload.text();
        return {
            ok: false,
            error: `${binaryUpload.status} ${binaryUpload.statusText}`,
            details: errorText.slice(0, 300),
            step: 'binary-upload'
        };
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
        console.log('✅ Image uploaded via files.completeUploadExternal');
        return {
            ok: true,
            permalink: completeResult.files?.[0]?.permalink || 'slack-upload',
            method: 'files.completeUploadExternal'
        };
    }

    return {
        ok: false,
        error: completeResult.error,
        step: 'files.completeUploadExternal',
        details: completeResult.response_metadata?.messages?.join(', ')
    };
}

async function uploadImageToSlack(imageData, messageText, mimeType = 'image/png') {
    const token = (process.env.SLACK_BOT_TOKEN || '').trim();
    const channel = (process.env.SLACK_CHANNEL_ID || '').trim();
    if (!token || !channel) {
        return { ok: false, error: 'missing_bot_config', step: 'config' };
    }

    const cleanedImageData = imageData.trim().replace(/\s/g, '');
    const buffer = Buffer.from(cleanedImageData, 'base64');
    const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
    const filename = `efficiency-report.${extension}`;

    console.log('📦 Slack image payload size:', buffer.length, 'bytes', mimeType);

    if (!buffer.length || buffer.length < 5000) {
        return {
            ok: false,
            error: `image_too_small (${buffer.length} bytes)`,
            step: 'validate'
        };
    }

    if (buffer.length > 9 * 1024 * 1024) {
        return {
            ok: false,
            error: `image_too_large (${Math.round(buffer.length / 1024 / 1024)}MB)`,
            step: 'validate'
        };
    }

    return uploadImageViaExternalFlow(token, channel, buffer, filename, mimeType, messageText);
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
        return imageUrl;
    }

    return null;
}

async function resolvePublicImageUrl(imageData, mimeType = 'image/png') {
    const uploaders = [
        (data) => uploadImageToImgbb(data),
        (data) => uploadImageTo0x0(data, mimeType)
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
        const useBot = Boolean(botToken && botChannel);

        if (!messageData) {
            return res.status(400).json({
                error: 'Missing required field: messageData'
            });
        }

        if (!webhookUrl && !useBot) {
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
            useBot,
            botChannel,
            imageBytes: imageData ? Buffer.from(imageData, 'base64').length : 0,
            hasWebhook: Boolean(webhookUrl)
        });

        if (useBot) {
            if (imageData) {
                const slackUpload = await uploadImageToSlack(
                    imageData,
                    messageData.text,
                    imageMimeType || 'image/png'
                );

                if (slackUpload.ok) {
                    return res.status(200).json({
                        success: true,
                        message: 'Report image uploaded to Slack via bot',
                        delivery: 'slack-bot-file',
                        method: slackUpload.method
                    });
                }

                const fallbackText = `${messageData.text}\n\n⚠️ Chart image failed to upload (${slackUpload.step}: ${slackUpload.error}). Check bot is invited to channel ${botChannel} and has files:write scope.`;
                const textOnly = await postSlackMessage(botToken, botChannel, fallbackText);

                if (textOnly.ok) {
                    return res.status(200).json({
                        success: true,
                        message: 'Sent text via bot because image upload failed',
                        delivery: 'slack-bot-text-only',
                        botError: slackUpload
                    });
                }

                return res.status(500).json({
                    error: 'Slack bot failed to upload image and post fallback text',
                    botError: slackUpload,
                    textError: textOnly
                });
            }

            const posted = await postSlackMessage(botToken, botChannel, messageData.text);
            if (posted.ok) {
                return res.status(200).json({
                    success: true,
                    message: 'Message sent to Slack via bot',
                    delivery: 'slack-bot-message'
                });
            }

            return res.status(500).json({
                error: 'Slack bot failed to post message',
                botError: posted
            });
        }

        let resolvedImageUrl = imageUrl || null;
        if (!resolvedImageUrl && imageData) {
            resolvedImageUrl = await resolvePublicImageUrl(imageData, imageMimeType || 'image/png');
        }

        const slackPayload = buildSlackPayload(messageData, resolvedImageUrl);
        if (!resolvedImageUrl && imageData) {
            slackPayload.text += '\n\n📊 Chart: [Image upload failed - configure SLACK_BOT_TOKEN + SLACK_CHANNEL_ID]';
        }

        await sendViaWebhook(webhookUrl, slackPayload);

        return res.status(200).json({
            success: true,
            message: 'Message sent to Slack successfully',
            imageUploaded: Boolean(resolvedImageUrl),
            delivery: resolvedImageUrl ? 'webhook-image-block' : 'webhook-text'
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}
