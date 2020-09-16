// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
/**
 * dsAuth handles authentication 
 * @type {{}}
 */

const oauthResponseHtml = 'oauthResponse.html';
const sdkString = "EnvBuilder v1";
const urlFrag = "/restapi/v2.1";

class DsAuth {

    constructor(appObject) {
        this.appObject = appObject;
    }

    /**
     * Starts the login process using Implicit Grant
     * The OAuthSection component is used.
     */
    startLogin() {
        this.clearAuth();
        this.oauthState = this.generateId();
        const url = `https://${process.env.DS_AUTH_SERVER}/oauth/auth?` +
                    `response_type=token&`                   +
                    `scope=signature%20me_profile&`          +
                    `client_id=${process.env.DS_CLIENT_ID}&` +
                    `state=${this.oauthState}&`              +
                    `redirect_uri=${process.env.DS_APP_URL}/${oauthResponseHtml}` ;
        this.oauthWindow = window.open(url, "_blank")
    }

    /**
     * We've received a message with the Implicit Grant results. Process it.
     * @param {object} e 
     * @param {string} source
     */
    receiveMessage(e, source) {
        if (source !== 'oauthResponse') {return}
        const hash = e.data && e.data.hash
            , accessTokenFound = hash && hash.substring(0,14) === '#access_token=';
        //console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!! hash: ${hash}`);
        if (!accessTokenFound) {return} // EARLY RETURN

        // Avoiding an injection attack: check that the hash only includes expected characters
        // An example: #access_token=eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQkAAAABAAUABwCA5xeRWULXSAgAgCc7n5xC10gCAHR-9s2Nn_hNv77uMjz2XvIVAAEAAAAYAAEAAAAFAAAADQAkAAAAN2ZiMmFhYmUtYjI3NC00MDQzLWIyYTItY2M1NDg0MGRmMzJkMACA5xeRWULXSBIAAQAAAAsAAABpbnRlcmFjdGl2ZQ.eUVqrmf4wZ8EQRqNPDI2AumqbNVrxlxCD0uq8YCWNDAvC1lAakTdInXUBLMMsjN-NxXChP7UX8VF870-kSsiR9izXj55-YjTHveCyEdJ-V9iSotZpHLZ58Y2ScGF4mreBmZqFX2jVed43NY71b-qAlghTP7VfMulP0KnpYwLWLllNSB-OIlg68tsVhbhiUayC5fLHRv0mm1lB9LCjf5GzeP3TJLTkQ5NiAqEmEGqdmo4r8BkRxxW4X1hBHq2iD3E2cMugdOpMFamUFRw3vHCHdDiJxYMy6RO8ogtpE98n915hj4jTc2wbtRnJqwiDA90mo-eq4pL5uzw1wKVQLqF6A&expires_in=28800&token_type=bearer&state=e3f287fbe932b904a660282242bfc58bd6a67fe2
        // No characters other than #.-&=_ a-z A-Z 0-9 (no spaces)
        const hashRegex = /[^#.\-&=_a-zA-Z0-9]/;
        if (hash.search(hashRegex) !== -1) {
            console.error (`Potential XSS attack via fragment (#) value: ${hash}`);
            this.appObject.status.append({msg: "Potential XSS attack via the fragment value. Please login again.", style: 'error'});
            return
        } 

        const regex = /(#access_token=)(.*)(&expires_in=)(.*)(&token_type=)(.*)(&state=)(.*)/
            , results = regex.exec(hash)
            , accessToken = results[2]
            , expiresIn = results[4]
            , incomingState = results[8]
            , stateOk = incomingState === this.oauthState
            ;
        if (!stateOk) {
            this.appObject.status.append({msg: "State error during login. Please login again.", style: 'error'});
            console.error(`OAuth state mismatch!! Expected state: ${this.oauthState}; received state: ${incomingState}`);
            return // EARLY RETURN
        }

        // calculate expires
        let expires = new Date()
        expires.setTime(expires.getTime() + expiresIn * 1000)
        //console.log (`Access Token: ${accessToken}`);
        //console.log (`Token expires: ${expires.toString()}`);
        this.accessToken = accessToken;
        this.expires = expires;
        this.appObject.dsFileMgr.addFilenames();

        if (this.useIframe) {
            this.appObject.oauthSection.close();
        } else {
            if (this.oauthWindow) {this.oauthWindow.close()}
        }
    }

    /**
     * If we either don't have a token, or if it is about to
     * expire, then return false.
     */
    checkToken() {
        const bufferTimeSec = 10 * 60 // 10 minutes
            , nowSec = (new Date()).getTime()/1000;
        if (this.accessToken && this.accountId && this.expires && 
             (this.expires.getTime()/1000) > (nowSec + bufferTimeSec)) {
                 return true
        } else {
            // No longer logged in, but we need the user to login:
            this.accessToken = false;
            this.meToken = false;
            this.appObject.loggedIn = false;
            return false
        }
    }

    /**
     * Clear this object
     * If we're logging in to upload docs, then don't delete the docs list
     */
    clearAuth() {
        this.accessToken = false;
        this.meToken     = false;
        this.expires     = false;
        this.accountId   = false;
        this.externalAccountId   = false;
        this.accountName = false;
        this.baseUri     = false;
        this.name        = false;
        this.email       = false;
    }

    logout() {
        this.clearAuth();
        this.appObject.resetDiagram();
        this.appObject.modalLogin.show();
    }

    /**
     * Complete the login process: fetch the UserInfo if it is not set and we have an access token
     */
    async completeLogin(startup) {
        let loggedIn = this.accessToken && this.accountId;
        this.appObject.loggedIn = loggedIn;

        if (!this.accessToken || this.accountId) {
            return; // EARLY RETURN -- either we're not logged in, or we're completely logged in
        }

        // We have an access token and need the user info: fetch the user info
        if (process.env.OVERRIDE_ACCOUNT_ID === '0') {
            // The normal case
            await this.setDefaultAccount(startup)
        } else {
            if (startup) {this.appObject.telemetry.start()}
            this.name = process.env.OVERRIDE_NAME;
            this.email = process.env.OVERRIDE_EMAIL;
            this.accountId   = process.env.OVERRIDE_ACCOUNT_ID;
            this.accountName = process.env.OVERRIDE_ACCOUNT_NAME;
            this.baseUri     = process.env.OVERRIDE_BASE_URL     
        }
        
        if (this.accountId) {
            // accountId and other settings were fetched
            this.appObject.loggedIn = true;
        }   
    }

    /**
     * Fetch the UserInfo and use the default account settings
     */
    async setDefaultAccount(startup) {
        let userInfoResponse;
        try {
            userInfoResponse = await this.fetchUserInfo()
        } catch (e) {
            this.appObject.status.append({msg: `Problem while completing login`,
                msg2: `Error: ${e.toString()}.`, msg3: `Please repeat your login.`, style: 'error'});
            return;
        }

        if (!userInfoResponse || !userInfoResponse.ok) {
            this.appObject.status.append({msg: `Problem while completing login`,
                msg2: `Error:${userInfoResponse.statusText}`, msg3: `Please repeat your login.`, style: 'error'});
            return;
        } 

        const userInfo = await userInfoResponse.json();
        this.name = userInfo.name;
        this.userId = userInfo.sub;
        this.email = userInfo.email;
        const defaultAccounts = userInfo.accounts.filter(acc => acc.is_default);
        this.accountId   = defaultAccounts[0].account_id;
        this.accountName = defaultAccounts[0].account_name;
        this.baseUri     = process.env.DS_API_CORS === '0' ? process.env.DS_REST // Use CORS gateway 
                                : defaultAccounts[0].base_uri;
        const docusignEmployee = this.email.search(
            /@docusign\.com$|@worldwidecorp\.us$/i) !== -1;
        const result = await this.appObject.telemetry.hashIds({userId: this.userId, accountId: this.accountId});
        this.accountHash = result.accountHash;
        this.userHash = result.userHash;
        if (startup) {await this.appObject.telemetry.start(this.userHash)}
        this.appObject.telemetry.track("Login.complete", 
            {"Account hash": this.accountHash, 
             "DocuSign employee": docusignEmployee,
             "User Creation Date": userInfo.created,
             "User Creation YM": userInfo.created.substring(0,7) // 2017-02
            }); 
        await this.setExternalAccountId()
    }
    
    async fetchUserInfo() {
        return fetch(`${process.env.DS_AUTHENTICATION}/oauth/userinfo`,
            {mode: 'cors',
            headers: new Headers({
                Authorization: `Bearer ${this.accessToken}`,
                Accept: `application/json`,
                "X-DocuSign-SDK": sdkString
                }) 
            })
    }

    async setExternalAccountId() {
        try {
            const url = `${this.baseUri}${urlFrag}/accounts/${this.accountId}`
                , response = await fetch(url,
                    {mode: 'cors',
                    method: 'GET',
                    headers: new Headers({
                        Authorization: `Bearer ${this.accessToken}`,
                        Accept: `application/json`,
                        "X-DocuSign-SDK": sdkString
                        }) 
                    })
                , data = response && response.ok && await response.json()
                ;
            this.externalAccountId = data.externalAccountId;
        } catch (e) {}
    }

    /**
     * Generate a psuedo random string
     * See https://stackoverflow.com/a/27747377/64904
     * @param {integer} len  length of the returned string
     */
    generateId (len) {
        // dec2hex :: Integer -> String
        // i.e. 0-255 -> '00'-'ff'
        function dec2hex (dec) {
            return ('0' + dec.toString(16)).substr(-2)
        }

        var arr = new Uint8Array((len || 40) / 2)
        window.crypto.getRandomValues(arr)
        return Array.from(arr, dec2hex).join('')
    }  
}
export { DsAuth }
