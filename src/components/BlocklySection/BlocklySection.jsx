// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import Flexbox from 'flexbox-react';
import BlocklyComponent from '../Blockly';
import Fluent from '../Fluent';
import Status from '../Status';
import Sdk from '../Sdk';
/* eslint import/no-webpack-loader-syntax: off */
import Blockly from 'blockly/core';
import {JsonToSdk} from '../../lib/dsJsonToSdk';
import {EnvelopePlusJSON} from '../../lib/dsEnvelopePlusJSON';
import startBlocks from '!!raw-loader!../../assets/startBlocks.xml';
import node_framework from '../../assets/NodeJS_example.zip';
import php_framework from '../../assets/PHP_example.zip';
import vb_framework from '../../assets/VB_example.zip';
import csharp_framework from '../../assets/CSharp_example.zip';
import java_framework from '../../assets/Java_example.zip';
import python_framework from '../../assets/Python_example.zip';
import ruby_framework from '../../assets/Ruby_example.zip';
import { ButtonFace} from '../../UxFaces';

// eslint-disable-next-line
let docusign = {EnvelopePlusJSON};
const blocklyWidth = 700
    , statusMargin = 0
    , documentDropdownExtension = "document_dropdown_extension"
    ;

class BlocklySection extends React.Component {
    constructor(props) {
        super(props);
        this.urls = {}
        this.urls[props.appObject.langNode  ] = node_framework;
        this.urls[props.appObject.langPhp   ] = php_framework;
        this.urls[props.appObject.langVB    ] = vb_framework;
        this.urls[props.appObject.langCSharp] = csharp_framework;
        this.urls[props.appObject.langJava  ] = java_framework;
        this.urls[props.appObject.langPython] = python_framework;
        this.urls[props.appObject.langRuby  ] = ruby_framework;
        // exampleFileNames records the filename of the example for each language
        this.exampleFileNames = {};
        this.exampleFileNames[props.appObject.langNode  ] = 'index.js';
        this.exampleFileNames[props.appObject.langPhp   ] = 'index.php';
        this.exampleFileNames[props.appObject.langJson  ] = 'envelope_definition.json';
        this.exampleFileNames[props.appObject.langVB    ] = 'Program.vb';
        this.exampleFileNames[props.appObject.langCSharp] = 'Program.cs';
        this.exampleFileNames[props.appObject.langJava  ] = 'Example.java';
        this.exampleFileNames[props.appObject.langPython] = 'main.py';
        this.exampleFileNames[props.appObject.langRuby  ] = 'main.rb';

        this.state = {
            fluent: "", 
            json: null, 
            sdk: null,
            width: 0, height: 0, // Window size. See https://stackoverflow.com/a/42141641/64904
            exampleObjectUrl: null,
            blocklySectionHeight: 0,
            statusHeight:0,
        };
        this.hashCode = false // hash of the JSON for the diagram. Used to determine changes (dirty)
        // false is a flag indicating that a hash value is needed

        this.initialXmlEl = Blockly.Xml.textToDom(startBlocks);

        // diagramDocuments are the filenames used by the diagram.
        // A diagram may reference a filename that this tool doesn't
        // know about. In that case, the filename is added to the 
        // tool's documents list. This is done in the Documents obj
        this.diagramDocuments = this.getDiagramDocs(this.initialXmlEl);
        // Set this.documentOptions:
        this.docDropdownSet(props.defaultDocuments);

        this.blocklyChangeListener = this.blocklyChangeListener.bind(this);
        this.blocklyClearSelection = this.blocklyClearSelection.bind(this);
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
        this.downloadFramework = this.downloadFramework.bind(this);
        this.downloadExample = this.downloadExample.bind(this);
        this.documentsDropdownOptions = this.documentsDropdownOptions.bind(this);
        this.downloadedDiagram = this.downloadedDiagram.bind(this);
        this.setBlocklySectionHeight = this.setBlocklySectionHeight.bind(this);
        this.setStatusHeight = this.setStatusHeight.bind(this);

        let thisBlocklySection = this;
        // See https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/dropdown#dynamic_dropdowns
        Blockly.Extensions.register(documentDropdownExtension,
            function() {
                this.getInput('INPUT')
                .appendField(
                    new Blockly.FieldDropdown(thisBlocklySection.documentsDropdownOptions), 'filename');
            }
        )
    }

    render () {
        const headerHeight = this.props.oliveUx ? 62 : 0
            , blocklyBufferH = this.props.oliveUx ? (62 + 42) : 62;
        return (
        <Flexbox flexDirection="row" width="100%" marginTop={headerHeight + "px"}>
            <Flexbox width={blocklyWidth + "px"}>
            {/* width here is same as width in BlocklyComponent.css */}
                <BlocklyComponent 
                    readOnly={false} 
                    move={{scrollbars: true, drag: true, wheel: true}} 
                    initialXmlEl={this.initialXmlEl}
                    blocklyBufferH={blocklyBufferH}
                    setBlocklySectionHeight = {this.setBlocklySectionHeight}
                    ref={e => this.blocklyEditor = e}
                    >
                </BlocklyComponent>
            </Flexbox>
            <Flexbox flexDirection="column" paddingLeft={statusMargin + "px"} 
                 width={`${this.state.width-blocklyWidth}px`} >
                <Status appObject={this.props.appObject}
                        oliveUx={this.props.oliveUx} 
                        setStatusHeight = {this.setStatusHeight}
                        ref={e => {this.props.setStatusObj(e)}} />
                <div id="outputDiv" 
                     ref={ (divElement) => { this.outputDivElement = divElement } }
                     style={{height: `${this.state.blocklySectionHeight - this.state.statusHeight}px`,
                             overflowY:'scroll',
                             paddingLeft: '30px',
                             paddingTop: this.props.oliveUx ? 'auto' : "1em" 
                             }} >
                    <h3 style={this.props.oliveUx ? {} : {fontSize: "1.5rem"}}>{this.props.languageNames(this.props.sdkLanguage)} 
                        {this.props.sdkLanguage !== this.props.appObject.langJson ? ' SDK':''}
                        <span style={{paddingLeft: "30px"}}><ButtonFace
                                kind="secondary"
                                onClick={this.props.sdkSettingsClicked}
                                size="small"
                                text="Change language"
                        /></span>
                        {this.props.sdkLanguage !== this.props.appObject.langJson ? 
                            (<span style={{paddingLeft: "30px"}}><ButtonFace
                                    kind="secondary"
                                    onClick={this.downloadFramework}
                                    size="small"
                                    text="Download example framework"
                            /></span>)
                            : null
                        }
                        <span style={{paddingLeft: "30px"}}><ButtonFace
                                kind="secondary"
                                onClick={this.downloadExample}
                                size="small"
                                text={this.props.sdkLanguage === this.props.appObject.langJson ?
                                    'Download JSON':'Download example'}
                        /></span>
                    </h3>
                    <a className="hidden" 
                        href={this.urls[this.props.sdkLanguage]}
                        rel="noopener noreferrer"
                        download={`${this.props.sdkLanguage}_example.zip`}
                        ref={e=>this.downloadA = e}>download framework</a>
                    <a className="hidden"
                        href={this.state.exampleObjectUrl}
                        download={this.exampleFileNames[this.props.sdkLanguage]}
                        ref={e=>this.downloadB = e}>download example</a>

                    <Sdk maxWidth={`${this.state.width-blocklyWidth-statusMargin}px`}
                        appObject={this.props.appObject} 
                        json={this.state.json}
                        sdk={this.state.sdk}
                        sdkLanguage={this.props.sdkLanguage}
                        sdkLanguageName={this.props.languageNames(this.props.sdkLanguage)} />
                    <Fluent fluent={this.state.fluent} />
                </div>
            </Flexbox>
        </Flexbox>
        )
    }

    componentDidMount() {
        this.blocklyEditor.addChangeListener(this.blocklyChangeListener);
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);      
    }

    updateWindowDimensions() {
        this.setState({ width: window.innerWidth, height: window.innerHeight});
    }      

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions);
    }

    setBlocklySectionHeight (h) {
        this.setState({ blocklySectionHeight: h });
    }      
        
    setStatusHeight (h) {
        this.setState({ statusHeight: h });
    }

    blocklyClearSelection() {
        Blockly.selected && Blockly.selected.unselect(); // will unhighlight the currently selected block
        Blockly.hideChaff(); // closes any menus, dropdowns, or flyouts that are open
    }
      
    /**
     * This function is called by Blockly each time the user changes
     * the current diagram (workspace).
     * It:
     *    * computes the fluent output from the blocks,
     *    * computes the JSON
     *    * computes the current SDK code
     */
    blocklyChangeListener() {
        const topBlocks = this.blocklyEditor && this.blocklyEditor.topBlocks
            , topBlock = topBlocks && topBlocks.find(b => b.type === "createEnvelope");

        // We don't want all blocks' code, just createEnvelope.
        // See https://groups.google.com/forum/#!topic/blockly/2tndZzpi-Zg
        const fluent = Blockly.JavaScript.blockToCode(topBlock);
        let errMsg = null
          , json = null
          , sdk = null;

        try {
            // eslint-disable-next-line
            json = eval(fluent).getJSON();

            // Dirty bit analysis
            const newHashCode = json && this.computeHashCode(json);
            if (json && this.hashCode === false) {
                // compute the hash
                this.hashCode = newHashCode;
                // clear dirty bit
                this.props.appObject.dirty = false;
            } else if (json && this.hashCode === newHashCode) {
                // Diagram is not dirty
                this.props.appObject.dirty = false;
            } else if (json && this.hashCode !== newHashCode) {
                // Something changed: mark the diagram as dirty
                this.props.appObject.dirty = true;
            }    
        } catch (e) {
            errMsg = e.message;
            json = {block_error:errMsg};
        }

        if (!errMsg) {
            const jsonToSdk = new JsonToSdk(this.props.appObject, this.props.sdkLanguage);
            sdk = jsonToSdk.convert(json);
        }

        this.setState({fluent: fluent, json: json, sdk: sdk});
        if (errMsg) {
            // Error message is shown in the SDK window. So we don't need it in the status window too.
            // this.props.appObject.status.set({msg: errMsg, style: 'error'});
        }
    }

    /**
     * 
     * @param {object} documents to be used for the document dropdown 
     */
    docDropdownSet(documentsObj){
        this.documentOptions = documentsObj.map(d => [d.filename, d.filename])
    }

    documentsDropdownOptions() {return this.documentOptions}

    /**
     * Walk the xml in the dom to find all document filename settings
     * in the diagram
     * @param {domElement} xmlEl 
     */
    getDiagramDocs(xmlEl) {
        // https://stackoverflow.com/questions/6969604/recursion-down-dom-tree
        let results = [];
        function func (node) {
            // Return the value of attr name of current node
            // https://developer.mozilla.org/en-US/docs/Web/API/Element/attributes
            function getAttr (node2, name) {
                let attrValue = "";
                if (!node2.hasAttributes()) {return attrValue};
                const attrs = node2.attributes;
                for(let i = 0; i < attrs.length; i++) {
                    if (attrs[i].name === name) {attrValue = attrs[i].value};
                    break;
                }
                return attrValue
            } 
            // Is the currentNode a field with attr filename?
            // Then return element value 
            // Looking for:  <field name="filename">anchorfields.pdf</field>
            function filenameSearch (currentNode) {
                let value = "";
                if (currentNode.nodeName !== "field") {return value};
                const nameAttr = getAttr(currentNode, "name");
                if (nameAttr !== "filename") {return value}
                return currentNode.textContent
            }

            if (node.nodeName !== "block") {return};
            let typeAttr = getAttr(node, "type");
            if (typeAttr !== "document") {return};
            // It's a document node. Find the value of the filename child
            let currentNode = node.firstChild;
            while (currentNode) {
                let filename = filenameSearch(currentNode);
                if (filename) {
                    results.push(filename);
                    return // all done
                }
                currentNode = currentNode.nextSibling
            }
        }

        function walkDOM (node, func) {
            func(node);
            node = node.firstChild;
            while(node) {
                walkDOM(node, func);
                node = node.nextSibling;
            }
        }

        walkDOM (xmlEl, func);
        return results
    }

    get json() {return this.state.json}
    get xmlString() {return this.blocklyEditor.xmlString}
    
    changeDiagram (xmlString) {
        this.blocklyEditor.xmlString = xmlString;
        this.hashCode = false;
    }

    downloadedDiagram() {
        this.hashCode = false;
        this.props.appObject.dirty = false;
    }

    resetDiagram() {
        this.blocklyEditor.xmlString = startBlocks;
        this.hashCode = false;
    }
    downloadFramework() {this.downloadA.click()}

    /**
     * download the JSON or current SDK output to the browser
     */
    downloadExample() {
        const content = this.props.sdkLanguage === this.props.appObject.langJson ? 
                JSON.stringify(this.state.json, null, '    ') : this.state.sdk
            , blob = new Blob([content])
            , exampleObjectUrl = URL.createObjectURL(blob)
            ;
        this.setState ({exampleObjectUrl: exampleObjectUrl}, () => {
            this.downloadB.click(); 
            URL.revokeObjectURL(exampleObjectUrl);  // free up storage--no longer needed.
            this.setState({exampleObjectUrl: ""})
        })
    }

    /**
     * Compute hash for the string
     * See https://stackoverflow.com/a/34842797/64904
     */
    computeHashCode (json) {
        const s = JSON.stringify(json);
        return s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0)
    }
}

export default BlocklySection;
