// DocuSign API Request Builder DocuSign Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
//
// The UxFaces classes are used to segregate the UX library. 
// This source can use either the public react-bootstrap UX or the private DocuSign UX
import React from 'react';
import './App.css';
import { RootEl, ModalFace, OliveUx, FooterFace } from './UxFaces';
import BlocklySection from './components/BlocklySection';
import ModalLogin from './components/ModalLogin';
import ModalVideos from './components/ModalVideos';
import ModalSaveDiagram from './components/ModalSaveDiagram';
import ModalOpenDiagram from './components/ModalOpenDiagram';
import ModalTimeout from './components/ModalTimeout';
import ModalExamples from './components/ModalExamples';
import Documents from './components/Documents';
import ModalSdkSettings from './components/ModalSdkSettings';
import HeaderSection from './components/HeaderSection';
import NPSSurvey from './components/NPSSurvey';
import { Telemetry } from './lib/telemetry';
import { DsApi } from './lib/dsApi';
import { DsAuth } from './lib/dsAuth';
import { DsFileMgr } from './lib/dsFileMgr';
/* eslint import/no-webpack-loader-syntax: off */
import blank_md from '!!raw-loader!./assets/documents/blank.md.txt';
import anchorfields_md from '!!raw-loader!./assets/documents/anchorfields.md.txt';
import orderform_md from '!!raw-loader!./assets/documents/orderform.md.txt';
import blank_pdf from './assets/documents/blank.pdf';
import anchorfields_pdf from './assets/documents/anchorfields.pdf'; 
import orderform_html from './assets/documents/orderform.html.txt'; 

// To be done
// Investigate alt UX for open source version
// See https://dev.to/davidepacilio/35-free-react-templates-and-themes-32ci

const sendEnvelopeKey = 'sendEnvelope'
    , addDocumentKey = 'addDocument'
    , openUrlKey = 'openUrl'
    , openEgKey = 'openEg'
    , sdkLanguagekey = 'sdkLanguage'
    , langNode = 'NodeJS'
    , langCSharp = 'CSharp'
    , langJava = 'Java'
    , langPhp = 'PHP'
    , langPython = 'Python'
    , langRuby = 'Ruby'
    , langJson = 'JSON'
    , langVB = 'VB'
    , languages = [langCSharp, langJava, langNode, langPhp, langPython, langRuby, langJson, langVB]
    , appTitle = 'API Request Builder by DocuSign'
    , sessionWarning = 20 // How many minutes until the user is warned to do something or be logged out
    , defaultDocuments = [
            {
                filename: 'blank.pdf',
                default: true,
                description: blank_md,
                fileUrl: blank_pdf,
                fileBlob: null
            },
            {
                filename: 'anchorfields.pdf',
                default: true,
                description: anchorfields_md,
                fileUrl: anchorfields_pdf,
                fileBlob: null
            },
            {
                filename: 'orderform.html',
                default: true,
                description: orderform_md,
                fileUrl: orderform_html,
                fileBlob: null
            },
        ]
    ;

class App extends React.Component {
    constructor(props) {
        super(props);
        this.telemetry = new Telemetry(this);
        this.dsApi = new DsApi(this);
        this.dsAuth = new DsAuth(this);
        this.dsFileMgr = new DsFileMgr(this);
        this.oliveUx = new OliveUx().oliveUx(); // Should the private UX be used?
        this.nextCommand = null;
        this.nextCommandData = null;
        this.startup = true;
        this.state = { // initial values
            sdkLanguage: this.getItem(sdkLanguagekey) || langNode, // used in multiple components
            visible: true,
            height: window.innerHeight,
            loggedIn: false,
            dirty: false,
        }

        this.blocklySection = null; // set via ref
        this.headerSection  = null; // set via ref
        this.oauthSection   = null; // set via ref
        this.status = null; // set via callback
        
        this.sendEnvelopeClicked = this.sendEnvelopeClicked.bind(this);
        this.loginActionHandler = this.loginActionHandler.bind(this);
        this.modalLoginShow = this.modalLoginShow.bind(this);
        this.resetDiagramClicked = this.resetDiagramClicked.bind(this);
        this.resetDiagram = this.resetDiagram.bind(this);
        this.logoutClicked = this.logoutClicked.bind(this);
        this.openDiagramClicked = this.openDiagramClicked.bind(this);
        this.saveDiagramClicked = this.saveDiagramClicked.bind(this);
        this.documentsClicked = this.documentsClicked.bind(this);
        this.examplesClicked = this.examplesClicked.bind(this);
        this.videosClicked = this.videosClicked.bind(this);
        this.sdkSettingsClicked = this.sdkSettingsClicked.bind(this);
        this.sdkLanguageOnChange = this.sdkLanguageOnChange.bind(this);
        this.receiveMessage = this.receiveMessage.bind(this);
        this.windowResized = this.windowResized.bind(this);
        this.timeoutWarn = this.timeoutWarn.bind(this);
        this.timeoutReset = this.timeoutReset.bind(this);
        this.onunload = this.onunload.bind(this);
        this.checkDiagramQP = this.checkUrlQp.bind(this);

        window.addEventListener("message", this.receiveMessage, false);
        window.addEventListener("resize", this.windowResized, false);
        window.addEventListener("beforeunload", this.onunload);
        this.timerWarning = null;
        this.timeoutReset();
        const timeoutEvents = ["load", "click", "keypress"];
        timeoutEvents.forEach(e => {window.addEventListener(e, this.timeoutReset)});
    }

    /**
     * Tool started up
     */
    async componentDidMount() {
        this.checkUrlQp(); // record any query parameter info
        while (!this.modalLogin) {await new Promise(r => setTimeout(r, 10))}
        this.modalLogin.show();
    } 

    render() {
        // Header: https://github.docusignhq.com/pages/FrontEndShared/components/index.html#/header
        return (
        <RootEl>
            <main className={this.state.visible ? '' : 'hidden'} >
                <HeaderSection
                    oliveUx = {this.oliveUx}
                    meToken='NONE'
                    accountId={this.dsAuth.externalAccountId}
                    accountGuid={this.dsAuth.accountId}
                    onLogoff={this.logoutClicked}
                    sendEnvelopeClicked={this.sendEnvelopeClicked}
                    resetDiagramClicked={this.resetDiagramClicked}
                    openDiagramClicked={this.openDiagramClicked}
                    saveDiagramClicked={this.saveDiagramClicked}
                    documentsClicked={this.documentsClicked}
                    examplesClicked={this.examplesClicked}
                    videosClicked={this.videosClicked}
                    saveBadge={this.state.dirty}
                />
                <ModalFace.Portal>
                    <ModalExamples appObject={this} ref={e => this.modalExamples = e} />
                    <ModalVideos appObject={this} ref={e => this.modalVideos = e} />
                    <ModalTimeout appObject={this} ref={e => this.modalTimeout = e} />
                    <ModalSaveDiagram appObject={this} ref={e => this.modalSaveDiagram = e} />
                    <ModalOpenDiagram appObject={this} oliveUx={this.oliveUx} ref={e => this.modalOpenDiagram = e} />
                    <ModalLogin appObject={this} dsAuth={this.dsAuth} ref={e => this.modalLogin = e} />
                    <Documents appObject={this} defaultDocuments={defaultDocuments} 
                        ref={e => this.documents = e} />
                    <ModalSdkSettings 
                        appObject={this}
                        ref={e => this.sdkSettings = e}
                        sdkLanguage={this.state.sdkLanguage} 
                        sdkLanguageOnChange={this.sdkLanguageOnChange}
                        languages={languages}
                        languageNames={this.languageNames} 
                    />
                </ModalFace.Portal>
                <BlocklySection
                    appObject={this}
                    oliveUx = {this.oliveUx}
                    sdkLanguage={this.state.sdkLanguage}
                    languageNames={this.languageNames}
                    ref={e => {this.blocklySection = e;}}
                    setStatusObj={status => {this.status = status}}
                    sdkSettingsClicked={this.sdkSettingsClicked}
                    defaultDocuments={defaultDocuments}
                />
                <NPSSurvey
                    appObject={this}
                    oliveUx={this.oliveUx}
                    ref={e => {this.npsSurvey = e;}} 
                />
            </main>
            <FooterFace />
        </RootEl>
        )
    }

    async sendEnvelopeClicked() {await this.dsApi.sendEnvelope()}
    logoutClicked() {
        this.telemetry.track("Logout");
        this.dsAuth.logout()
    }
    loginActionHandler() {this.dsAuth.startLogin()}
    modalLoginShow(msg) {this.modalLogin.show(msg)}
    resetDiagramClicked() {
        this.telemetry.track("Reset Diagram");
        this.resetDiagram();
    }
    resetDiagram() {
        this.blocklySection.resetDiagram();
        this.documents.deleteItems();
        this.dsFileMgr.resetMetadata();
    }
    openDiagramClicked() {this.modalOpenDiagram.show()}
    saveDiagramClicked() {this.modalSaveDiagram.show()}
    documentsClicked() {this.documents.show()}
    videosClicked() {this.modalVideos.show()}
    examplesClicked() {this.modalExamples.show()}
    sdkSettingsClicked() {this.sdkSettings.show()}
    nextCommandIsSendEnvelope() {this.nextCommand = sendEnvelopeKey}
    nextCommandIsAddDocument() {this.nextCommand = addDocumentKey}
    nextCommandIsOpenDiagramUrl() {this.nextCommand = openUrlKey}
    nextCommandIsOpenEg() {this.nextCommand = openEgKey}
    docDropdownSet(documentsObj){this.blocklySection.docDropdownSet(documentsObj)}
    sdkLanguageOnChange(sdkLanguage) {
        this.setState({sdkLanguage: sdkLanguage},
            () => {this.blocklySection.blocklyChangeListener()}
        );
        this.setItem(sdkLanguagekey, sdkLanguage);
        this.sdkSettings.close();
    };

    windowResized(e) {this.setState({height: window.innerHeight})}

    /**
     * Receive message from a child window
     * @param {object} e 
     */
    async receiveMessage(e) {
        const rawSource = e && e.data && e.data.source
            , ignore = {'react-devtools-inject-backend': true,
                        'react-devtools-content-script': true,
                        'react-devtools-detector': true,
                        'react-devtools-bridge': true}
            , source = (rawSource && !ignore[rawSource]) ? rawSource : false
            ;
        if (!source) {return}; // Ignore if no source field
        if (source === 'oauthResponse') {
            this.dsAuth.receiveMessage(e, source);
            await this.dsAuth.completeLogin(this.startup); // starts telemetry
            this.startup = false;
        }
        if (source === 'dsResponse') {this.dsApi.receiveMessage(e, source)}

        this.blocklySection.blocklyChangeListener();
        const requestedCommand = this.nextCommand;
        this.nextCommand = null;

        if (requestedCommand === sendEnvelopeKey && this.dsAuth.checkToken()) {
            await this.dsApi.sendEnvelope(true)
        }
        if (requestedCommand === addDocumentKey && this.dsAuth.checkToken()) {
            this.documents.resumeUpload()
        }
        if (requestedCommand === openUrlKey) {
            this.telemetry.track("Open Diagram.qp url", 
            {"Diagram open url": this.nextCommandData});
            await this.dsFileMgr.openUrl(this.nextCommandData);
            this.nextCommandData = null;
        }
        if (requestedCommand === openEgKey) {
            this.telemetry.track("Open example.qp", 
            {"Diagram open example": this.nextCommandData});
            await this.modalExamples.openExampleByTitle(this.nextCommandData);
            this.nextCommandData = null;
        }
    }

    /**
     * Check/handle query parameter `dgm` or `eg`was supplied.
     */
    checkUrlQp() {
        const location = window.location
            , myUrl = location.origin + location.pathname
            , params = (new URL(location)).searchParams
            , dgmUrl = params.get('dgm')
            , eg = params.get('eg');
        if (dgmUrl) {
            this.nextCommandIsOpenDiagramUrl();
            this.nextCommandData = dgmUrl;
            window.history.pushState({}, "", myUrl);
        }
        if (eg) {
            this.nextCommandIsOpenEg();
            this.nextCommandData = eg;
            window.history.pushState({}, "", myUrl);
        }
    }

    set visible (visible){this.setState({visible: visible})}
    set loggedIn (loggedIn) {
        this.setState({loggedIn: loggedIn});
        if (loggedIn) {this.timeoutReset()};
    }
    set dirty (dirty) {this.setState({dirty: dirty})}
    get appTitle() {return appTitle};
    get langCSharp() {return langCSharp}
    get langJava() {return langJava}
    get langNode() {return langNode}
    get langPhp() {return langPhp}
    get langPython() {return langPython}
    get langRuby() {return langRuby}
    get langJson() {return langJson}
    get langVB() {return langVB}
    get languages() {return languages}
    get sdkLanguage() {return this.state.sdkLanguage}
    languageNames (lang) {
        if      (lang === langCSharp) {return "C#"          }
        else if (lang === langNode  ) {return "Node.JS"     }
        else if (lang === langVB    ) {return "Visual Basic"}
        else return lang
    }
    get accessToken() {return this.dsAuth.accessToken}
    get accountId() {return this.dsAuth.accountId}
    get isAddDocumentNext() {return this.nextCommand === addDocumentKey}

    /**
     * Session auto-logout support
     */
    timeoutReset() {
        if (this.timerWarning) {window.clearTimeout(this.timerWarning)}
        this.timerWarning = window.setTimeout(this.timeoutWarn, sessionWarning * 1000 * 60);
    }
    timeoutWarn() {
        if (this.state.loggedIn) {this.modalTimeout.show()}
    }

    /**
     * User leaving window?
     */
    onunload(e) {
        if (this.state.dirty) {
            const msg = "You have unsaved changes";
            e.preventDefault();
            e.returnValue = msg;
            return msg;
        } else {
            return undefined
        }
    }

    /**
     * Since localstorage only handles strings, store value as a JSON object's attribute
     * @param {string} item 
     * @param {*} value 
     */
    setItem (item, value) {
        let o = {};
        o[item] = value;
        localStorage.setItem(item, JSON.stringify(o))
    }
    /**
     * Return the stored value or null if not found
     * @param {string} item 
     */
    getItem(item) {
        const s = localStorage.getItem(item)
        if (s) {
            const o = JSON.parse(s);
            return o[item]
        } else {
            return null
        }
    }
}

export default App;
