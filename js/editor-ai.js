(function($) {
    // Function to enhance text using OpenAI
    async function enhanceText(text, callback) {
        const apiKey = editorAISettings.openai_api_key;
        const tone = editorAISettings.tone;
        const brandVoice = editorAISettings.brand_voice;
        const model = editorAISettings.model;
        const blacklist = editorAISettings.blacklist;

        if (!apiKey) {
            alert('Please set your OpenAI API key in the plugin settings.');
            return;
        }

        const blacklistPrompt = blacklist 
            ? `\n\nAvoid using the following words: ${blacklist}.` 
            : '';

        const prompt = `Given the following text, provide subtle alternatives and corrections. Adjust the tone to be ${tone} and align with this brand voice description: "${brandVoice}"${blacklistPrompt}\n\nText to enhance:\n${text}`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model, // Use the selected model instead of hardcoding 'gpt-3.5-turbo'
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant that provides subtle text improvements and tone adjustments.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 150,
                    n: 1,
                    temperature: 0.7,
                })
            });

            const data = await response.json();
            
            if (data.choices && data.choices.length > 0) {
                const enhancedText = data.choices[0].message.content.trim();
                callback(enhancedText);
            } else {
                throw new Error('No suggestions received from OpenAI');
            }
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            alert('Error enhancing text. Please check the console for details.');
        }
    }

    // Attach the enhanceText function to the window object so it can be called from the TinyMCE plugin
    window.enhanceText = enhanceText;

    // You could add more functionality here, such as real-time suggestions as the user types
})(jQuery);
