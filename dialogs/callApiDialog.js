
const { TextPrompt } = require('botbuilder-dialogs');
const Expressions = require('../utils/expressions');
// const { stringify } = require('querystring');
const fetch = require('node-fetch');

var Buffer = require('buffer').Buffer;

class CustomApiDialog extends TextPrompt {
    constructor(flow, services) {
        super(flow.objectId);
        this.dialog = flow;
        // this.userState = userState;
        console.log('CustomApiDialog cosntru');
        // Implement your custom text dialog logic here
    }

    // for random characters for prefix and suffix
    async randomCharacters() {
        const inputString = 'abcdefghijklmnopqrstuvwxyz';
        const randomIndexes = [];

        while (randomIndexes.length < 3) {
            const randomIndex = Math.floor(Math.random() * inputString.length);

            if (!randomIndexes.includes(randomIndex)) {
                randomIndexes.push(randomIndex);
            }
        }
        const randomCharacters = randomIndexes.map((index) => inputString.charAt(index));

        return randomCharacters.join('');
    }

    // converts url to base 64 encryption and returns the baseurl, encrypted key, type and method(GET/POST)
    async dynamicEncrytion(baseUrl, urlToEncrypt, method) {
        // console.log(Buffer.from(url_to_encrypt).toString('base64'));
        var encryptedKey = Buffer.from(urlToEncrypt).toString('base64');
        var prefix = await this.randomCharacters();
        var suffix = await this.randomCharacters();
        // console.log(typeof encryptedKey);
        encryptedKey = prefix + encryptedKey + suffix;
        // var api_key = prefix + Buffer.from(encryptedKey,'base64').toString('utf8') + suffix
        if (method === 'GET') {
            // var final_url = base_url + 'encryption_key=' + encrypted_key + '&type=ios'
            return { baseUrl: baseUrl, encryption_key: encryptedKey, type: 'ios', method: method };
        } else {
            return { baseUrl: baseUrl, encryption_key: encryptedKey, type: 'ios', method: method };
        }
        // console.log(final_url);
        // return encrypted_key
    }

    // function to get dynamic api key for modules
    async dynamicApiKey(compCode, moduleName, method) {
        var baseUrl = 'https://' + compCode + '.honohr.com/sapi/Service/dynamicAPIKeys_v2?';
        var apiUrl = baseUrl + 'comp_code=' + compCode + '&api_key=b9317ab4b73bf5bf9a9ccf5a1344bb18';

        const ApiUrlDict = await this.dynamicEncrytion(baseUrl, apiUrl, method);
        // base_url + 'encryption_key=' + encrypted_key + '&type=ios'
        const dynamicApiUrl = ApiUrlDict.baseUrl + 'encryption_key=' + ApiUrlDict.encryption_key + '&type=' + ApiUrlDict.type;
        var requestOptions = {
            method: 'GET',
            // headers: myHeaders,
            redirect: 'follow'
        };

        const response = await fetch(dynamicApiUrl, requestOptions);
        var responseJson = await response.json();
        console.log('resssssssssssssssssssss: ', responseJson);
        // eslint-disable-next-line no-undef, camelcase
        var module_name = moduleName;
        return responseJson.api_keys[module_name]; // not in camel case as module_name is a key in api
    }

    async callApi(innerDc, flowData) {
        // string expression to fill the variables in json
        const newExpression = new Expressions();
        console.log(innerDc.user.user);
        const valueString = await newExpression.StringExpressionJson(JSON.stringify(this.dialog), innerDc.user.user);
        console.log(valueString);
        var expVal = JSON.parse(valueString);
        console.log('********* ', expVal.url_endpoint);
        var moduleName = expVal.module;

        // get api key for required module
        var apiKey = await this.dynamicApiKey(expVal.body.comp_code, moduleName, 'GET');

        // make url for api call
        var baseUrl = 'https://' + expVal.body.comp_code + '.honohr.com/' + expVal.url_endpoint;
        var parameterUrl = baseUrl + 'comp_code=' + expVal.body.comp_code + '&emp_code=' + expVal.body.emp_code + '&api_key=' + apiKey + '&token=' + expVal.body.token;
        var queryString = await newExpression.StringExpressionJson(JSON.stringify(this.dialog.queryParameter), flowData.dictionary);

        if (queryString !== undefined) {
            var queryStringVal = JSON.parse(queryString);
            console.log(queryStringVal);
            parameterUrl = parameterUrl + queryStringVal;
        }

        const apiUrlDict = await this.dynamicEncrytion(baseUrl, parameterUrl, expVal.method);
        console.log('apiUrlDict: ', apiUrlDict);
        /// //////////////////////////
        var response = '';
        if (apiUrlDict.method === 'POST') {
            // {"baseUrl":base_url,"encryption_key":encrypted_key,"type":"ios","method":method}
            var body = { encryption_key: apiUrlDict.encryption_key, type: apiUrlDict.type };
            console.log(apiUrlDict.baseUrl);
            console.log(body);
            var requestOptions = {
                method: 'POST',
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' },
                redirect: 'follow'
            };
            response = await fetch(apiUrlDict.baseUrl, requestOptions);
        // eslint-disable-next-line brace-style
        }
        // GET request
        else {
            var apiUrl = apiUrlDict.baseUrl + 'encryption_key=' + apiUrlDict.encryption_key + '&type=' + apiUrlDict.type;
            requestOptions = {
                method: 'GET',
                // headers: myHeaders,
                redirect: 'follow'
            };

            response = await fetch(apiUrl, requestOptions);
        }

        // const response = await fetch(apiUrl, requestOptions)
        const jsonResponse = await response.json();
        flowData.dictionary.submit = jsonResponse;
        // console.log(jsonResponse);
        return jsonResponse;
    }

    // turnContext, state, options, isRetry
    async beginDialog(innerDc, flowData) {
        // var module_name = 'LEAVE'
        console.log('call api begin DIalog');
        console.log(innerDc);
        console.log(flowData);
        const jsonResponse = await this.callApi(innerDc, flowData);
        console.log(jsonResponse);
        // this.dialog.api_response = jsonResponse
        innerDc.api_response = jsonResponse;
        console.log('yoooooooo');

        // return await innerDc
        return await innerDc.endDialog();
        // await this.sendTextToUser(turnContext, jsonResponse);
    }

    async continueDialog(innerDc) {
        console.log('call api continue DIalog');
        // innerDc = await this.beginDialog(innerDc)
        return await innerDc.endDialog();
    }

    async sendTextToUser(context, text) {
        // console.log('qwerty');
        // console.log(text);
        await context.sendActivity(text);
    }
}

module.exports.CustomApiDialog = CustomApiDialog;
