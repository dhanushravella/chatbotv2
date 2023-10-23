// import fetch from "node-fetch"

// const fetch = require('node-fetch');
const fetch = require('node-fetch');

async function intentClassify(usrText) {
    console.log('******************************************************');

    const res = await fetch('https://honohrclu.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2022-10-01-preview', {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': '769bf0da207e4517bf96f99e8fb69024',
            'Apim-Request-Id': '4ffcac1c-b2fc-48ba-bd6d-b69d9942995a',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            kind: 'Conversation',
            analysisInput: {
                conversationItem: {
                    id: '1',
                    text: usrText,
                    modality: 'text',
                    language: 'en',
                    participantId: '1'
                }
            },
            parameters: {
                projectName: 'Chatbotv2',
                verbose: true,
                deploymentName: 'DeploymentNlp_v1',
                stringIndexType: 'TextElement_V8'
            }
        })
    });

    var intent = await res.json();

    return intent;
}

module.exports = { intentClassify };
