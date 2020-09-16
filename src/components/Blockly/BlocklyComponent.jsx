/**
 * @license
 * 
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Blockly React Component.
 * @author samelh@google.com (Sam El-Husseini)
 */

/* eslint import/no-webpack-loader-syntax: off */
import toolboxsrc from '!!raw-loader!./toolbox.xml';
import React from 'react';
import './BlocklyComponent.css';
import Blockly from 'blockly/core';
import 'blockly/javascript';
import locale from 'blockly/msg/en';
import 'blockly/blocks';
import {addBlocks} from './blocks.js';
import {addBlockCode} from './blocks-code.js';

Blockly.setLocale(locale);

class BlocklyComponent extends React.Component {
    constructor(props) {
        super(props);
        this.hfHeight = this.props.blocklyBufferH; // header + footer heights
        this.state = {h: (window.innerHeight - this.hfHeight) + "px"};
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }

    componentDidMount() {
        const { initialXml, children, ...rest } = this.props;
        addBlocks(Blockly); // Adds all of the blocks to the palette
        addBlockCode(Blockly); // Adds the blocks' generator code      

        this.primaryWorkspace = Blockly.inject(
            this.blocklyDiv,
            {
                toolbox: toolboxsrc,
                ...rest
            },
        );

        if (this.props.initialXml) {
            Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(this.props.initialXml), this.primaryWorkspace);
        }
        if (this.props.initialXmlEl) {
            Blockly.Xml.domToWorkspace(this.props.initialXmlEl, this.primaryWorkspace);
        }
        this.primaryWorkspace.clearUndo(); // Reset the undo stack
        window.addEventListener('resize', this.updateWindowDimensions);
        this.updateWindowDimensions();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions);
    }

    updateWindowDimensions() {
        let h = window.innerHeight - this.hfHeight;
        this.props.setBlocklySectionHeight(h);
        this.setState({h: h + "px"});
    }

    get workspace() {
        return this.primaryWorkspace;
    }

    set xmlString(xml) {
        this.primaryWorkspace.clear();
        Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), this.primaryWorkspace);
        this.primaryWorkspace.clearUndo();
    }

    get xmlDom() {
        return Blockly.Xml.workspaceToDom(this.primaryWorkspace)
    }

    get xmlString() {
        return Blockly.Xml.domToPrettyText(this.xmlDom)
    }

    get topBlocks() {
        return this.primaryWorkspace.getTopBlocks(true)
    }

    addChangeListener(listener) {this.primaryWorkspace.addChangeListener(listener)}

    render() {
        return <React.Fragment>
            <div ref={e => this.blocklyDiv = e} id="blocklyDiv" style={{height: this.state.h}}/>
        </React.Fragment>;
    }
}

export default BlocklyComponent;