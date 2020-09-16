// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
/**
 * dsFileMgr handles open/save and examples
 * @type {{}}
 */

const diagramMimeType = 'text/vnd-dgm'
    , DGM_VERSION = 1
    ;

class DsFileMgr {

    constructor(appObject) {
        this.appObject = appObject;
        this.title = ""; // Title, category, and description for the current diagram
        this.category = "";
        this.description = "";
        this.instructions = "";
        this.filenames = []; // The filenames in the dgm file
        this.resetMetadata();
    }

    resetMetadata() {
        // For the default diagram
        this.title = "Embedded signing ceremony"; 
        this.category = "";
        this.description = `Embedded signing ceremony with one signer and one \`sign here\` tab.
The tab uses anchor string (AutoPlace) positioning.`;
        this.instructions = `Set the **email** and **name** fields of the **signer** and **Embedded Signing Ceremony** blocks.
        
Then click the **Send Envelope** button (top right).`;
        if (this.appObject.status) {this.appObject.status.set({msg: `API Request Builder`, msg2: this.instructions, style: 'md'})}
        this.filenames = []; // just the usual
    }

    /**
     * @returns {Blob} dgmBlob -- the dgm as a blob that can be downloaded/saved by the user
     * @param {string} title 
     * @param {string} category 
     * @param {string} description 
     * @param {string} instructions 
     */
    async getDownloadBlob (title, category, description, instructions) {
        this.title = title || "";
        this.category = category || "";
        this.description = description || "";
        this.instructions = instructions || "";
        const documents = this.appObject.dsApi.findDocuments(this.appObject.blocklySection.json)
            , onlyUnique = (value, index, srcArray) => srcArray.indexOf(value) === index
            ;
        this.filenames = documents.map(d => d.filename).filter(onlyUnique);
        // create the files array for the diagram
        const files = [];
        for (let i=0; i < this.filenames.length; i++) {
            const filename = this.filenames[i];
            if (this.appObject.documents.isDefaultDocument(filename)) {continue} // skip default documents

            const documentDataURL = await this.appObject.documents.documentDataURL(filename);
            files.push({filename: filename, documentDataURL: documentDataURL});
        }
        const dgm = {
            version: DGM_VERSION, title: this.title, category: this.category, description: this.description,
            instructions: this.instructions, filenames: this.filenames,
            diagram: this.appObject.blocklySection.xmlString,
            files: files
        };
        return new Blob([JSON.stringify(dgm, null, "    ")], {type: diagramMimeType});
    }

    /**
     * Reads the local (browser's computer) file and then loads it as the current diagram
     * @param {string} filename 
     * @param {File} contents 
     */
    async openDiagramFile (filename, contents) {
        this.appObject.status.set({msg: `Opening diagram file ${filename}...`, style: "bold"});
        let dgm;
        try {
            dgm = JSON.parse(contents);
        } catch (e) {
            this.appObject.status.append({msg: `Could not open diagram file ${filename}`, 
                msg2: `Error: ${e.toString()}`,
                msg3: 'Only diagram (.dgm) files can be opened.', style: "error"});
            this.appObject.telemetry.track("Open Diagram file invalid file name");
            return
        }
        if (dgm && dgm.version && dgm.version === DGM_VERSION) {
            await this.processIncomingDgm(dgm);
        } else {
            this.appObject.status.append({msg: `Could not open diagram file ${filename}`, 
            msg2: `Error: not a valid diagram file.`,
            msg3: 'Only diagram (.dgm) files can be opened.', style: "error"});
            this.appObject.telemetry.track("Open Diagram file invalid diagram");
        }
    }

    /**
     * Process a dgm object -- update the diagram to use the new dgm, store the metadata
     * @param {Object} dgm -- a dgm object
     */
    async processIncomingDgm(dgm) {
        const hasFiles = dgm.files && dgm.files.length > 0
            , files = hasFiles ? dgm.files : [];
        this.title = dgm.title;
        this.category = dgm.category;
        this.description = dgm.description;
        this.instructions = dgm.instructions;
        this.filenames = dgm.filenames;
        await this.appObject.documents.addFiles(this.filenames, files)
        this.appObject.blocklySection.changeDiagram(dgm.diagram);
        this.appObject.status.append({msg: `done`, append: true});
        if (this.instructions) {this.appObject.status.append(
            {msg: `Instructions`, msg2: this.instructions, style: 'md'})
            // Instructions can be in markdown.
        }
    }

    /**
     * Add the current diagram's filenames to the tool's state
     */
    addFilenames() {
        this.appObject.documents.addFilenames(this.filenames);
    }

    /**
     * GETs the URL and then loads it as the current diagram
     * A valid DocuSign access token is needed. It is used as
     * the user's bona fides to the gateway.
     * @param {string} url 
     */
    async openUrl (url) {
        this.appObject.status.set({msg: `Opening diagram...`, style: "bold"});
        
        if (!this.appObject.dsAuth.checkToken()) {
            this.appObject.status.append({msg: "Requested login, please wait...", style: 'regular'});
            this.appObject.nextCommandIsOpenDiagramUrl();
            this.appObject.nextCommandData = url;
            this.appObject.modalLoginShow(
                "Please login to fetch a diagram from a URL.");
            return; // EARLY RETURN
        }
        
        this.appObject.telemetry.track("Open Diagram url", 
            {"Diagram open url": url}, false);
        let dgm
          , gatewayUrl = new URL(process.env.DS_ENV_BUILDER_GATEWAY)
          , gatewayQp = {url: url}
        gatewayUrl.search = new URLSearchParams(gatewayQp);

        try {
            const response = await fetch (gatewayUrl, {
                mode: 'cors',
                headers: {'Authorization': `Bearer ${this.appObject.accessToken}`}
            });
            if (response.ok) {
                dgm = await response.json();
            } else {
                const errReport = await response.text();
                this.appObject.status.append ({msg: `Problem while retrieving the file`,
                    msg2: `Status: ${response.status}`,
                    msg3: `Error: ${errReport}`, style: 'error' });
                this.appObject.telemetry.track("Open Diagram url error", 
                    {"Diagram open url error": `Status ${response.status}: ${errReport}`}, false);        
                return    
            }
        } catch (e) {
            this.appObject.status.append({msg: `Problem while retrieving the file`,
                msg2: `${e.toString()}`, style: 'error'});
            this.appObject.telemetry.track("Open Diagram url error", 
                {"Diagram open url error": e.toString()}, false);        
            return
        }
        if (dgm && dgm.version && dgm.version === DGM_VERSION) {
            await this.processIncomingDgm(dgm);
        } else {
            this.appObject.status.append({msg: `Could not open the diagram file.`, 
                msg2: `Error: not a valid diagram file.`,
                msg3: 'Only diagram (.dgm) files can be opened.', style: "error"});
            this.appObject.telemetry.track("Open Diagram url invalid diagram");        
        }
    }

    /**
     * GETs the URL from this server (no CORS),
     * fixes the description's assets,
     * and then loads it as the current diagram
     * @param {string} url 
     * @param {object} dgmAssets
     */
    async openDgmExample (url, dgmAssets) {
        this.appObject.status.set({msg: `Opening example diagram...`, style: "bold"});
        let dgm

        try {
            const response = await fetch (url);
            if (response.ok) {
                dgm = await response.json();
            } else {
                const errReport = await response.text();
                this.appObject.status.append ({msg: `Problem while retrieving the example diagram`,
                    msg2: `Status: ${response.status}`,
                    msg3: `Error: ${errReport}`, style: 'error' });
                return    
            }
        } catch (e) {
            this.appObject.status.append({msg: `Problem while retrieving the example diagram`,
                msg2: `${e.toString()}`, style: 'error'});
            return
        }
        if (dgm && dgm.version && dgm.version === DGM_VERSION) {
            dgm = this.fixDgmAssets(dgm, dgmAssets);
            await this.processIncomingDgm(dgm);
        } else {
            this.appObject.status.append({msg: `Could not open the example diagram file.`, 
            msg2: `Error: not a valid diagram file.`,
            msg3: 'Only diagram (.dgm) files can be opened.', style: "error"});
        }
    }

    /**
     * Change any markdown reference to a plain file name to 
     * use the asset's location from the dgmAssets map
     * Eg [foo](foo.png) becomes [foo](/stactic/foo.1223.png)
     * If the filename includes a /, leave it alone
     * @param {object} dgm A diagram file 
     * @param {object} dgmAssets mapping of asset => url
     */
    fixDgmAssets(dgm, dgmAssets) {
        const reg = /\]\((((?!\/).)*)\)/gm
            , replaceFunction = (match, p1) => `](${dgmAssets[p1]})`
            ;
        dgm.instructions = dgm.instructions.replace(reg, replaceFunction);
        return dgm
    }
}
export { DsFileMgr }
