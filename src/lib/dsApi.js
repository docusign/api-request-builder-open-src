// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
/**
 * dsApi handles DocuSign API work 
 * @type {{}}
 */

//import { getJSDocThisTag } from "typescript";

const sdkString = "ApiRBuilder v1"; // for X-DocuSign-SDK header
const urlFrag = "/restapi/v2.1";
const dsResponsePage = "dsResponse.html";
const loadSigningCeremonyPage = "loadSigningCeremony.html"
const docusignHome = "https://docusign.com";

class DsApi {

    constructor(appObject) {
        this.appObject = appObject;
        this.json = null;
    }

    async sendEnvelope(resuming = false) {
        if (resuming) {
            this.appObject.status.append({msg: "Resuming: Send envelope", style: 'regular'})
        } else {
            this.appObject.status.set({msg: "Send envelope", style: 'bold'})
        }
        if (! this.appObject.dsAuth.checkToken()) {
            this.appObject.status.append({msg: "Requested login, please wait...", style: 'regular'});
            this.appObject.nextCommandIsSendEnvelope();
            this.appObject.modalLoginShow();
            return; // EARLY RETURN
        }

        // Make a copy of the JSON
        this.json = JSON.parse(JSON.stringify(this.appObject.blocklySection.json));
        await this.sendEnvelopeApi()
    }

    async sendEnvelopeApi() {
        const documents = this.findDocuments(this.json)
            , embeddedSigningKeys = this.json.createRecipientViewReq && 
                Object.keys(this.json.createRecipientViewReq)
            , embeddedSigning = embeddedSigningKeys && embeddedSigningKeys.length
            ;
        if (embeddedSigning && process.env.IFRAME_SIGNING_CEREMONY !== "1") {
            // Need to open the embedded signing window here so it is not blocked
            let url = `${process.env.DS_APP_URL}/${loadSigningCeremonyPage}`;
            this.signingCeremonyWindow = window.open(url, "_blank");
        }

        this.signingCeremonyStatus("Uploading documents...");
        for (let i = 0; i < documents.length; i++) {
            const err = await this.appObject.documents.getDocument(documents[i]);
            if (err === 'WANT_UPLOAD') {
                this.appObject.documents.show(documents[i].filename)
            }
            if (err) {
                this.signingCeremonyWindowClose();
                return;
            }
        }

        this.appObject.status.append({msg: 'Sending envelope API request.', style: 'regular'});
        this.signingCeremonyStatus("Sending envelope API request...");
        let envelopeId = await this.sendEnvelopeRequest();
        this.appObject.documents.postEnvelopeReq();
        if (!envelopeId) {
            this.appObject.npsSurvey.badSend()
            this.signingCeremonyWindowClose();
            return // Failure to launch!
        }
        if (embeddedSigning) {
            // The user wants a recipient view!
            if (this.json.createRecipientViewReq.returnUrl && 
                this.json.createRecipientViewReq.returnUrl === docusignHome) {
                    this.json.createRecipientViewReq.returnUrl = process.env.DS_APP_URL
                }
            this.appObject.status.append({msg: 'Sending recipient view API request.', style: 'regular'});
            this.signingCeremonyStatus("Sending recipient view API request...");
            let redirectUrl = await this.createRecipientView(envelopeId);
            if (redirectUrl) {
                this.appObject.status.append(
                    {msg: 'Opening the signing ceremony...', style: 'regular'});
                this.signingCeremonyStatus("Opening the signing ceremony...");
                this.signingCeremonyWindow.location = redirectUrl;
            } else {
                this.signingCeremonyWindowClose()
            }
            // A good send for embedded view is noted in function receiveMessage
        } else {
            // Note a good send here when we're not doing an embedded view.
            this.appObject.npsSurvey.goodSend()
        }
    }

    /**
     * Uploads and commits a chunk. 
     * @returns {err, chunkedUploadId, chunkedUploadUri, expirationDateTime}
     * 
     * @param {object} doc -- the doc object within the envelope def JSON 
     * @param {string} filename  -- document filename
     * @param {blob} blob -- the file to be uploaded to DS using chunk API
     */
    async uploadChunk(filename, blob) {
        try {
            const url = `${this.appObject.dsAuth.baseUri}${urlFrag}/accounts/${this.appObject.dsAuth.accountId}/chunked_uploads`;
            let form = new FormData();
            form.append('', new Blob([this.str2ab("{}")], {type: "application/json"}));
            form.append(filename, blob, filename);
            let response = await fetch (url, {
                mode: 'cors',
                method: 'POST',
                body: form,
                headers: {
                    'Accept': 'application/json',
                    'X-DocuSign-SDK': `${sdkString} ${this.appObject.sdkLanguage}`,
                    'Authorization': `Bearer ${this.appObject.dsAuth.accessToken}`
                }
            });

            if (response.status !== 201) {
                const errReport = await response.json();
                this.appObject.status.append(
                    {msg: `Could not upload document ${filename}`,
                    msg2: `Status: ${response.status}. Please try again.`,
                    msg3: JSON.stringify (errReport, null, '    '),
                    style: 'error'}); 
                return {err: true}           
            }
            // finalize the chunk
            let jsonResponse = await response.json();
            const url2 = `${this.appObject.dsAuth.baseUri}${urlFrag}/accounts/${this.appObject.dsAuth.accountId}/chunked_uploads/${jsonResponse.chunkedUploadId}`;
            response = await fetch (url2, {
                mode: 'cors',
                method: 'PUT',
                body: "{}",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-DocuSign-SDK': `${sdkString} ${this.appObject.sdkLanguage}`,
                    'Authorization': `Bearer ${this.appObject.dsAuth.accessToken}`
                }
            });
            if (response.status !== 200) {
                const errReport = await response.json();
                this.appObject.status.append(
                    {msg: `Could not finalize upload of document ${filename}`,
                    msg2: `Status: ${response.status}. Please try again.`,
                    msg3: JSON.stringify (errReport, null, '    '),
                    style: 'error'}); 
                return {err: true}                   
            }
            jsonResponse = await response.json();
            return {
                err: false, 
                chunkedUploadId: jsonResponse.chunkedUploadId,
                chunkedUploadUri: jsonResponse.chunkedUploadUri,
                expirationDateTime: jsonResponse.expirationDateTime    
            }
        } catch (e) {
            this.appObject.status.append(
                {msg: `Could not upload document ${filename}`,
                msg2: `Error: ${e.toString()}. Please try again.`,
                style: 'error'});
            return  {err: true}
        }
    }
        
    /**
     * Converts a string to an ArrayBuffer
     * See https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
     * 
     * @param {string} str
     * @returns {ArrayBuffer} buf
     */
    str2ab(str) {
        var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
        var bufView = new Uint16Array(buf);
        for (var i=0, strLen=str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }
    
    /**
     * Send the diagram's JSON envelope definition as an envelope request. 
     * @returns {string} envelopeId
     */
    async sendEnvelopeRequest() {
        this.appObject.telemetry.track("Sending envelope", {"Envelopes attempted": 1});
        try {
            const url = `${this.appObject.dsAuth.baseUri}${urlFrag}/accounts/${this.appObject.dsAuth.accountId}/envelopes`;
            let response = await fetch (url, {
                mode: 'cors',
                method: 'POST',
                body: JSON.stringify(this.json.envelopeDefinition, null, '    '),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-DocuSign-SDK': `${sdkString} ${this.appObject.sdkLanguage}`,
                    'Authorization': `Bearer ${this.appObject.dsAuth.accessToken}`
                }
            });

            const responseHeaders = this.getResponseHeaders(response);
            if (response.status !== 201) {
                //this.ux.postErrorMsg(`Problem while creating the envelope`);
                const errResponse = await response.json();
                this.appObject.status.append(
                    {msg: `Problem while creating the envelope.`,
                    msg2: `Error code: ${errResponse.errorCode}.`,
                    msg3: `Message: ${errResponse.message}`,
                    msg4: responseHeaders, style: 'error'});
                this.appObject.telemetry.track("Envelope error", 
                  {"Envelope error code": errResponse.errorCode,
                   "Envelope error message": errResponse.message, 
                   "Envelope errors": 1});
                return null 
            }
            // Get the envelope Id
            let jsonResponse = await response.json();
            this.appObject.status.append(
                {msg: `Success!`,
                msg2: `Response: ${JSON.stringify (jsonResponse, null, ' ')}`, 
                msg3: responseHeaders, style: 'bold'});
            this.appObject.telemetry.track("Sent envelope", {"Envelopes sent": 1, "Envelope id": jsonResponse.envelopeId});
            return jsonResponse.envelopeId
        } catch (e) {
            this.appObject.status.append({msg: `Could not create the envelope`,
                msg2: `Error: ${e.toString()}. Please try again.`, style: 'error'});
            this.appObject.telemetry.track("Envelope error", 
                {"Envelope error": e.toString(), "Envelope errors": 1});
            return null
        }
    }

    /**
     * Pretty print the response headers
     * @param {object} response 
     */
    getResponseHeaders (response) {
        const ignore = {'cache-control': true, 'content-length': true, 
            'content-type': true, 'date': true};
        let responseHeaders = "API usage response headers: {";
        for (let header of response.headers){
            if (!ignore[header[0]]) {
                responseHeaders += `${header[0]}: ${header[1]}, `
            }
        }
        responseHeaders += "}";
        return responseHeaders
    }

     /**
     * Send the createRecipientView request. 
     * @param {string} envelopeId
     * @returns {string} redirectUrl
     */
    async createRecipientView(envelopeId) {
        try {
            const url = `${this.appObject.dsAuth.baseUri}${urlFrag}/accounts/${this.appObject.dsAuth.accountId}/envelopes/${envelopeId}/views/recipient`;
            let json = JSON.parse(JSON.stringify(this.json.createRecipientViewReq));
            json.returnUrl = `${process.env.DS_APP_URL}/${dsResponsePage}`;
            let response = await fetch (url, {
                mode: 'cors',
                method: 'POST',
                body: JSON.stringify(json, null, '    '),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-DocuSign-SDK': `${sdkString} ${this.appObject.sdkLanguage}`,
                    'Authorization': `Bearer ${this.appObject.dsAuth.accessToken}`
                }
            });

            const responseHeaders = this.getResponseHeaders(response);

            if (response.status !== 201) {
                const errResponse = await response.json();
                this.appObject.status.append({msg: `Problem while creating the recipient view.`,
                    msg2: `Error code: ${errResponse.errorCode}.`,
                    msg3: `Message: ${errResponse.message}`,
                    msg4: responseHeaders, style: 'error'});
                return null
            }
            // Get the envelope Id
            let jsonResponse = await response.json();
            this.appObject.status.append({msg: `Success!`,
                msg2: `Response: ${JSON.stringify (jsonResponse, null, ' ')}`, 
                msg3: responseHeaders, style: 'bold'});
            return jsonResponse.url
        } catch (e) {
            this.appObject.status.append({msg: `Could not create the envelope's signing ceremony`,
                msg2: `Error: ${e.toString()}. Please try again.`, style: 'error'});
            return null
        }
    }

    /**
     * Find all of the document objects in the json
     * @returns {array} documents -- array of document objects in the this.json input
     */
    findDocuments(json) {
        // document objects are found in attributes documents (array) and document
        // Recursive search to find all of them in this.json
        const documents = [];

        function findDocumentsRecursive(o) {
            const attributeNames = Object.keys(o);
            attributeNames.forEach(attributeName => {
                if (attributeName === 'documents') {
                    o[attributeName].forEach((doc, i) => documents.push(o[attributeName][i]))
                }
                if (attributeName === 'document') {
                    documents.push(o[attributeName])
                }
                if (typeof o[attributeName] === 'object' && !Array.isArray(o[attributeName])) {
                    findDocumentsRecursive(o[attributeName])
                }
                if (typeof o[attributeName] === 'object' && Array.isArray(o[attributeName])) {
                    o[attributeName].forEach((a, i) => findDocumentsRecursive(o[attributeName][i]))
                }
            })
        }

        findDocumentsRecursive(json)
        return documents
    }

    /**
     * We've received a message with the DocuSign platform results. Process it.
     * @param {object} e 
     * @param {string} source
     */
    receiveMessage(e, source) {
        if (source !== 'dsResponse') {return}
        if (process.env.IFRAME_SIGNING_CEREMONY === "1") {
           this.appObject.embeddedSigningSection.close();
        } else {
            this.signingCeremonyWindowClose()
        }
        const href = e.data && e.data.href;
        if (!href) {return}
        this.appObject.status.addQpEvents(href);
        this.appObject.npsSurvey.goodSend();
    }

    /**
     * Post a message to the signing ceremony window
     * @param {string} msg 
     */
    signingCeremonyStatus(msg) {
        if (!this.signingCeremonyWindow) {return}
        try {
            if (!this.signingCeremonyStatusEl) {this.signingCeremonyStatusEl = 
                this.signingCeremonyWindow.document.getElementById("status")
            }
            if (this.signingCeremonyStatusEl) {
                this.signingCeremonyStatusEl.innerText = msg
            }
        } catch {}
    }

    signingCeremonyWindowClose() {
        if (!this.signingCeremonyWindow) {return}
        try {
            this.signingCeremonyWindow.close()
        } catch {}
    }

}
export { DsApi }
