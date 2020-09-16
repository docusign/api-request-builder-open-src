// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React, {createRef} from 'react';
import { ModalFace, ButtonFace, TableFace, LoadingSpinnerFace, 
         TooltipFace, FormFace} from '../../UxFaces';
/* eslint import/no-webpack-loader-syntax: off */
import examples from '../../assets/diagramExamples.json';

// eslint-disable-next-line
const diagramContex = require.context('../../assets/diagramExamples'); //, false, /.*\.(?!json)/);

class ModalExamples extends React.Component {
    constructor(props) {
        // prop appObject is required //
        super(props);
        const titleRefs = [];
        examples.examples.forEach( (v, i) => titleRefs[i] = createRef());
        this.state = {
            visible: false,
            examples: examples,
            dgmFiles: {},
            dgmAssets: {},
            tooltipI: null,
            tooltipEl: null,
            titleRefs: titleRefs
        };
        this.dsFileMgr = this.props.appObject.dsFileMgr;
        this.close = this.close.bind(this);
        this.openExample = this.openExample.bind(this);
        this.openExampleByTitle = this.openExampleByTitle.bind(this);
    }

    render () {
        return (
            <ModalFace
                {...this.props}
                visible={this.state.visible}
                width='xlarge'
                closeButton={<ModalFace.Close onClick={this.close}/>}
                onClose={this.close}
            >
                <ModalFace.Header title="Examples"/>
                <ModalFace.Body>
                    {this.state.examples ? (
                    <FormFace onSubmit={this.handleSubmit}>
                        <TableFace>
                            <TableFace.Header>
                                <TableFace.HeaderCell text="Category" />
                                <TableFace.HeaderCell text="Title" />
                                <TableFace.HeaderCell text="Open" />
                            </TableFace.Header>
                            <TableFace.Body>
                            {this.state.examples.examples.map( (example, i) =>
                                <TableFace.Row key={`example${i}`} >
                                    <TableFace.Cell>{example.category}</TableFace.Cell>
                                    <TableFace.Cell>
                                        <div onMouseEnter={this.mouseEnter.bind(this, i)} onMouseLeave={this.mouseLeave.bind(this)}
                                             ref={this.state.titleRefs[i]}>
                                            {example.title}
                                        </div>
                                    </TableFace.Cell>
                                    <TableFace.Cell>
                                        <ButtonFace kind="primary" onClick={this.openExample} size="small" text="Open"
                                                data-filename={example.filename} />
                                    </TableFace.Cell>
                                </TableFace.Row>
                            )}
                            </TableFace.Body>
                        </TableFace>
                        {this.state.examples.examples.map( (example, i) =>
                            <TooltipFace key={`examplett${i}`} text={example.description} 
                            visible={this.state.tooltipI === i} anchorElement={this.state.tooltipEl} alignment="start" />
                        )}
                    </FormFace>
                    ) : (<LoadingSpinnerFace text="Loading..." />)
                    }
                </ModalFace.Body>
                <ModalFace.Footer>
                    <ButtonFace
                        kind="secondary"
                        onClick={this.close}
                        size="large"
                        text="Close"
                    />
                </ModalFace.Footer>
            </ModalFace>
        )
    }

    async componentDidMount() {
        const dgmFiles = {}
            , dgmAssets = {}
            , dgmRaw = {}
            , importAll = requireContext => 
                requireContext.keys().forEach(
                    key => dgmRaw[key] = requireContext(key));
            
        importAll(diagramContex);
        // Next, sort the .dgm files from the rest
        // Also, remove leading './' from each key
        Object.keys(dgmRaw).forEach(k => {
            if (k.substr(k.length - 4) === '.dgm') {
                // .dgm file
                dgmFiles[k.substring(2)] = dgmRaw[k]
            } else {
                dgmAssets[k.substring(2)] = dgmRaw[k]
            }
        })
        this.setState({
            dgmFiles: dgmFiles, dgmAssets: dgmAssets})
    }

    mouseEnter(i, event) {
        // alternative is to use event.target 
        // Main issue is that TooltipFace animation slows the TooltipFace closing, gives UX errors
        this.setState({tooltipEl: this.state.titleRefs[i].current, tooltipI: i})
    }
    mouseLeave(event) {
        this.setState({tooltipEl: null, tooltipI: null})
    }

    show () {
        this.props.appObject.blocklySection.blocklyClearSelection();
        this.setState({visible: true});
        this.props.appObject.telemetry.track("Examples.show");
    }        
    close () {this.setState({visible: false})}      
    handleSubmit (e) {e.preventDefault()}
    async openExample(e) {
        const filename = e.target.getAttribute('data-filename')
            , url = this.state.dgmFiles[filename]
            ;
        this.setState({visible: false})
        this.props.appObject.telemetry.track("Examples.open", 
            {"Diagram open example": filename}, false);
        await this.dsFileMgr.openDgmExample(url, this.state.dgmAssets);
    }

    async openExampleByTitle(title) {
        const item = examples.examples.find(i => i.title === title)
            , filename = item && item.filename
            , url = filename && this.state.dgmFiles[filename]
            ;
        if (url) {await this.dsFileMgr.openDgmExample(url, this.state.dgmAssets)}
    }
}

export default ModalExamples;
