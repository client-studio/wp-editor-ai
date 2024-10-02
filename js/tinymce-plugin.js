(function() {
    tinymce.create('tinymce.plugins.EditorEnhancer', {
        init: function(ed, url) {
            ed.addButton('editor_enhancer_button', {
                title: 'Enhance Text',
                cmd: 'editor_enhancer_command',
                icon: 'icon dashicons-edit'
            });

            ed.addCommand('editor_enhancer_command', function() {
                var selectedText = ed.selection.getContent({format: 'text'});
                if (selectedText) {
                    // Call the main enhancement function
                    enhanceText(selectedText, function(enhancedText) {
                        ed.selection.setContent(enhancedText);
                    });
                }
            });
        },
        createControl: function(n, cm) {
            return null;
        },
    });
    tinymce.PluginManager.add('editor_enhancer_button', tinymce.plugins.EditorEnhancer);
})();

tinymce.PluginManager.add('editor_ai_button', function(editor, url) {
    // Add custom CSS to limit dialog width and style the text boxes
    editor.on('init', function() {
        var style = editor.dom.create('style', {type : 'text/css'});
        editor.dom.setHTML(style, `
            .mce-container.mce-panel.mce-floatpanel { 
                max-width: 90vw !important;
                border-radius: 6px !important;
                overflow: hidden !important;
            }
            .ai-versions-container {
                max-height: 600px;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 10px;
                margin: -10px;  /* Counteract dialog body padding */
                position: relative;
                width: 100%;
            }
            .ai-text-box {
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                border-radius: 4px;
                padding: 10px 10px 10px 30px;
                margin-bottom: 10px;
                cursor: pointer;
                max-width: 100%;
                box-sizing: border-box;
                white-space: normal;
                position: relative;
                height: 140px;
                overflow-y: auto;

                position: relative;
            }
            .ai-text-box:hover {
                background-color: #e0e0e0;
            }
            .ai-text-box.selected {
                background-color: #d0d0d0;
                border-color: #999;
            }
            .ai-version-number {
                position: absolute;
                left: 10px;
                top: 10px;
                font-weight: bold;
            }
            .ai-version-content {
                display: block;
                width: 100%;
                
                white-space: pre-wrap;
                font-size: 14px;
                line-height: 1.4;
            }
        `);
        document.getElementsByTagName('head')[0].appendChild(style);
    });

    editor.addButton('editor_ai_button', {
        text: 'AI',
        icon: false,
        onclick: function() {
            var selectedText = editor.selection.getContent({format: 'text'});
            if (!selectedText) {
                editor.notificationManager.open({
                    text: 'Please select some text first.',
                    type: 'info'
                });
                return;
            }

            // Show loading indicator
            editor.setProgressState(true);

            // Call the AI enhancement function
            enhanceTextWithAI(selectedText, function(enhancedVersions) {
                editor.setProgressState(false);

                if (enhancedVersions.error) {
                    editor.notificationManager.open({
                        text: 'Error: ' + enhancedVersions.error,
                        type: 'error'
                    });
                    return;
                }

                // Open a dialog with the three versions
                editor.windowManager.open({
                    title: 'AI Writer',
                    body: [
                        {
                            type: 'container',
                            html: '<div class="ai-versions-container">' +
                                '<p>Here are your new text versions:</p>' +
                                enhancedVersions.map((version, index) => 
                                    `<div class="ai-text-box" data-version="${index + 1}">
                                        <span class="ai-version-number">${index + 1}.</span>
                                        <span class="ai-version-content">${version.replace(/^\d+\.\s*/, '')}</span>
                                    </div>`
                                ).join('') +
                                '</div>'
                        }
                    ],
                    onsubmit: function(e) {
                        var selectedVersion = e.target.getEl().querySelector('.ai-text-box.selected');
                        if (selectedVersion) {
                            var versionContent = selectedVersion.querySelector('.ai-version-content').textContent;
                            editor.selection.setContent(versionContent);
                        }
                    },
                    width: Math.min(600, window.innerWidth * 0.9),
                    height: Math.min(700, window.innerHeight * 0.9)
                });

                // Add click event listeners to the text boxes
                setTimeout(function() {
                    var textBoxes = document.querySelectorAll('.ai-text-box');
                    textBoxes.forEach(function(box) {
                        box.addEventListener('click', function() {
                            textBoxes.forEach(b => b.classList.remove('selected'));
                            this.classList.add('selected');
                        });
                    });
                }, 100);
            });
        }
    });

    function enhanceTextWithAI(text, callback) {
        // Check if editorAISettings is defined
        if (typeof editorAISettings === 'undefined') {
            callback({ error: 'Editor AI settings are not defined. Please check your configuration.' });
            return;
        }

        var apiKey = editorAISettings.openai_api_key;
        var tone = editorAISettings.tone;
        var brandVoice = editorAISettings.brand_voice;
        var language = editorAISettings.language;
        var model = editorAISettings.model;
        var blacklist = editorAISettings.blacklist;
        var temperature = editorAISettings.temperature;

        // Check if required settings are available
        if (!apiKey || !tone || !brandVoice || !language || !model || temperature === undefined) {
            callback({ error: 'One or more required AI settings are missing. Please check your configuration.' });
            return;
        }

        var data = {
            model: model,
            messages: [
                {
                    role: "system",
                    content: `You are an AI assistant that enhances text. Use a ${tone} tone. Brand voice: ${brandVoice}. Respond in ${language}. Provide three distinct, enhanced versions of the given text without any introductions or explanations. Number each version 1, 2, and 3.`
                },
                {
                    role: "user",
                    content: `Enhance the following text:\n\n${text}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            n: 1
        };

        fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                callback({ error: data.error.message });
            } else {
                var versions = data.choices[0].message.content.split('\n\n').filter(v => v.trim() !== '');
                callback(versions.slice(0, 3));
            }
        })
        .catch(error => {
            callback({ error: 'Failed to connect to the AI service.' });
        });
    }
});