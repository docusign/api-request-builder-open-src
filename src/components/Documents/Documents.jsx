// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import { ModalFace, ButtonFace, TableFace, FileInputFace, 
         LoadingSpinnerFace, FormFace } from '../../UxFaces';
import ReactMarkdown from 'react-markdown';
//import { isConstructorDeclaration } from 'typescript';
// eslint-disable-next-line
const documentsContex = require.context('../../assets/documents');

const chunkedUploadsAreOneTimeUse = process.env.UPLOADS_R_1_TIME_USE === '1'; // Usually true

class Documents extends React.Component {
    constructor(props) {
        // prop appObject is required //
        super(props);

        // Fix the descriptions of the default docs to use current file references
        // Copy the defaultDocuments
        let defaultDocuments = JSON.parse(JSON.stringify(this.props.defaultDocuments));
        const reg = /\((((?!\/).)*)\)/gm
            , replaceFunction = (match, p1) => `(${documentsContex('./' + p1)})`
            ;
        defaultDocuments.forEach((v,i) => {
            defaultDocuments[i].description = v.description.replace(reg, replaceFunction);
        }) 

        this.state = {
            visible: false,
            reloadFile: null, // if set to a filename, then we need just that file to be re-uploaded 
            loadingDoc: false,
            documents: defaultDocuments
            // format {filename, default, description, fileObj, 
            //         fileUrl, chunkedUploadId, chunkedUploadUri, expirationDateTime, fileBlob }
            // fileUrl is only used for the default files.
            // fileObj is used for user-selected files.
        };

        this.close = this.close.bind(this);
        this.docDelete = this.docDeleteClicked.bind(this);
    }

    show (reloadFile = null) {
        this.props.appObject.telemetry.track("Documents.show");
        this.props.appObject.blocklySection.blocklyClearSelection();
        if (reloadFile) {
            this.setState({visible: true, reloadFile: reloadFile, loadingDoc: false})
        } else {
            this.setState({visible: true, reloadFile: null, loadingDoc: false})
        }
    }        
    close () {this.setState({visible: false})}

    render () {
        return (
            <ModalFace
                {...this.props}
                visible={this.state.visible}
                kind="secondary"
                width='xlarge'
                closeButton={<ModalFace.Close onClick={this.close}/>}
                onClose={this.close} 
            >
                <ModalFace.Header title={this.state.reloadFile ? `Upload ${this.state.reloadFile}` : "Documents"}/>
                <ModalFace.Body>
                    <div>
                        {this.state.reloadFile ? 
                        <p>Your diagram uses file {this.state.reloadFile}. Please upload it.</p>
                        :
                        <p>You can use your own documents, or the default documents.</p>
                        }
                    </div>
                    <FormFace onSubmit={this.handleSubmit} className='markdown'>
                        {this.state.reloadFile ? 
                        null
                        :
                        <TableFace>
                            <TableFace.Header>
                                <TableFace.HeaderCell text="Document Filename" />
                                <TableFace.HeaderCell text="Description" />
                                <TableFace.HeaderCell text="" />
                            </TableFace.Header>
                            <TableFace.Body>
                            {this.state.documents.map( (doc, i) =>
                                <TableFace.Row key={`doc${doc.filename}`} >
                                    <TableFace.Cell>{doc.filename}</TableFace.Cell>
                                    <TableFace.Cell>
                                        <ReactMarkdown source={doc.description} key={`sm${i}`} 
                                            linkTarget={() => '_blank' } />
                                    </TableFace.Cell>
                                    <TableFace.Cell>
                                        {doc.default ? 'default document' : 
                                        <ButtonFace
                                            kind="secondary"
                                            onClick={this.docDeleteClicked}
                                            size="small"
                                            text="Clear"
                                            data-filename={doc.filename}
                                        />
                                        }
                                    </TableFace.Cell>
                                </TableFace.Row>
                            )}
                            </TableFace.Body>
                        </TableFace>
                        }
                    </FormFace>
                </ModalFace.Body>
                <ModalFace.Footer>
                    {this.state.loadingDoc ? 
                        <LoadingSpinnerFace size="small" text="Loading..." />
                        :
                        <FileInputFace 
                            text={this.state.reloadFile ? "Upload the file" : "Add a document"}
                            size="large"
                            onChange={async evt => await this.addDocumentClicked(evt)}
                        />
                    }
                    <span style={{marginLeft: "30px"}}><ButtonFace
                        kind="secondary"
                        onClick={this.close}
                        size="large"
                        text="Close"
                    /></span>
                </ModalFace.Footer>
            </ModalFace>
        )
    }
    
    /**
     * The user has clicked on a FileInputFace control to add a new document or upload an already referenced document
     * @param {*} evt 
     */
    async addDocumentClicked(evt) {
        if (evt.target.files.length === 0) {
            evt.target.value = null;
            this.props.appObject.telemetry.track("Documents.add doc: no doc");
            return // EARLY RETURN
        }

        const fileObj = evt.target.files[0]
            , document = {  // The draft new document item for state.documents collection
                filename: fileObj.name,
                default: false,
                description: "Document",
                fileObj: fileObj,
                newDoc: true,
                fileBlob: null
            }
            ;
        this.props.appObject.telemetry.track("Documents.add doc", {"Document added": fileObj.name}, false);

        // Next, add the document to state.documents
        // However, there might already be an entry for the document if it is
        // used in a newly loaded diagram.
        const alreadyInDocuments = this.state.documents.find (d => d.filename === document.filename)
            , replacingDefaultDocument = this.state.documents.find (d => 
                (d.filename === document.filename && d.default))
            ;
        if (replacingDefaultDocument) {
            this.props.appObject.status.append({msg: "Error: you can't replace a default document", style: 'error'});
            return; // EARLY RETURN
        }
        
        // newDocuments is an updated version of the existing documents item with the new fileObj
        // newDocuments only applies if (alreadyInDocuments)
        const newDocuments = alreadyInDocuments ? this.state.documents.map(d => {
                if (d.filename !== document.filename) {return d}
                d.fileObj = document.fileObj;
                return d
            }) : null;

        // Check that we have a token
        if (! this.props.appObject.dsAuth.checkToken()) {
            if (alreadyInDocuments) {
                this.setState({loadingDoc: true, documents: newDocuments})
            } else {
                this.setState(state => ({documents: state.documents.concat(document)}));
            }
            this.props.appObject.status.append({msg: "Requested login, please wait...", style: 'regular'});
            this.props.appObject.nextCommandIsAddDocument();
            this.close();
            this.props.appObject.modalLoginShow("Please login to upload your document. Your current diagram will be saved.");
            return; // EARLY RETURN
        }

        // Called *after* the document has been added (or updated) in state.documents
        const uploadDocument = async () => {
            const results = await this.uploadDoc(document.filename);
            if (!results.err) {
                // Update document dropdowns
                this.props.appObject.docDropdownSet(this.state.documents);
            }
            this.setState ({loadingDoc: false});
            if (this.state.reloadFile) {
                this.setState({reloadFile: null});
                this.close();
                await this.props.appObject.dsApi.sendEnvelope(true);
            }
        }

        if (alreadyInDocuments) {
            this.setState({loadingDoc: true, documents: newDocuments}, uploadDocument);
        } else {
            this.setState(state => ({loadingDoc: true, documents: state.documents.concat(document)}), 
                uploadDocument)
        }
        evt.target.value = null;
    }

    /**
     * User clicked on the Document Delete ButtonFace
     * @param {*} evt 
     */
    docDeleteClicked(evt) {
        const filename = evt.target.getAttribute('data-filename')
            , documents = this.state.documents.filter( doc => doc.filename !== filename)
            ;
        this.props.appObject.telemetry.track("Documents.delete doc", {"Document deleted": filename}, false);
        this.setState({documents: documents})
        this.props.appObject.docDropdownSet(documents);
    }

    handleSubmit (e) {e.preventDefault()}

    /**
     * @returns Is the filename parameter a default document for the tool?
     * @param {*} filename 
     */
    isDefaultDocument(filename) {
        return this.state.documents.find (d => (d.filename === filename && d.default))
    }
    
    /**
     * @returns a dataURL for the document, or null if there's an issue
     * @param {*} filename 
     */
    async documentDataURL(filename) {
        // See https://stackoverflow.com/questions/18650168/convert-blob-to-base64
        // and https://stackoverflow.com/questions/43084557/using-promises-to-await-triggered-events
        const document = this.state.documents.find (d => d.filename === filename);
        if (!document || !document.fileBlob) {
            return null; // EARLY return
        }
        
        const reader = new FileReader();
        await new Promise(resolve => {
            reader.onloadend = resolve;
            reader.readAsDataURL(document.fileBlob); 
        });
        
        return reader.result;                
    }

    /**
     * Add a set of filenames and files to the documents collection and dropdown
     * @param {array} filenames -- list of filenames 
     * @param {array} files -- list of {filename, documentDataURL}
     */
    async addFiles(filenames, files) {
        // Add the files. If a document entry exists than overwrite the file.
        let newFiles = []; // Will be filled with the files info, plus the actual blobs 
        for (let i=0; i < files.length; i++) {
            this.props.appObject.telemetry.track("Diagram add doc", 
                {"Diagram doc added": files[i].filename,
                 "Diagram doc added count": files.length}, false);
            newFiles.push ({
                filename: files[i].filename,
                // See https://stackoverflow.com/a/36183085/64904
                fileBlob: await (await fetch(files[i].documentDataURL)).blob()
            })
        }

        // Update existing files
        let newDocuments = this.state.documents.map(v => {
            const newFileIndex = newFiles.findIndex(f => f.filename === v.filename);
            if (newFileIndex !== -1) {
                newFiles[newFileIndex].used = true; // mark it used
                return {
                    filename: v.filename,
                    default: v.default,
                    description: v.description,
                    fileObj: null, fileUrl: null,
                    newDoc: false,
                    chunkedUploadId: null, chunkedUploadUri: null, expirationDateTime: null,
                    fileBlob: newFiles[newFileIndex].fileBlob   
                }
            } else {
                return v
            }
        })
        // Add new documents
        newFiles.forEach(v => {
            if (v.used) {return}
            newDocuments.push ({
                filename: v.filename,
                default: false,
                description: "Document",
                fileObj: null, fileUrl: null,
                newDoc: false,
                chunkedUploadId: null, chunkedUploadUri: null, expirationDateTime: null,
                fileBlob: v.fileBlob
            })
        })
        const setStateCB = () => this.addFilenames(filenames);
        this.setState(state => ({documents: newDocuments}), setStateCB)
    }

    /**
     * Add the filenames parameter to the documents collection.
     * Known filenames are skipped.
     */
    addFilenames(filenames) {
        if (!filenames) {return};
        filenames.forEach(filename => {
            const found = this.state.documents.find (d => d.filename === filename);
            if (found) {return}; // skip!
            const document = {
                filename: filename,
                default: false,
                description: "Document",
                fileObj: null,
                newDoc: false,
                fileBlob: null
            }
            this.setState(state => ({loadingDoc: true, documents: state.documents.concat(document)}))
        });
        this.props.appObject.docDropdownSet(this.state.documents);
    }

    /**
     * @returns err -- truthy if envelope send should be stopped
     * @side-effect -- updates doc's remoteUrl attribute
     * @param {*} doc -- doc is a document object in the envelope definition json
     */
    async getDocument(doc) {
        let err = false;
        const filename = doc.filename;
        let docInfo = this.state.documents.find (d => d.filename === filename);
        const uploadBuffer = 10 * 60 * 1000; // 10 minutes in millisec

        const availableOnPlatform = () => docInfo.chunkedUploadUri &&
            !chunkedUploadsAreOneTimeUse &&
            (new Date(docInfo.expirationDateTime).valueOf() - uploadBuffer) > new Date().valueOf();

        if (!docInfo) {
            err = `Could not find information on document ${filename}`;
            this.props.appObject.status.append({msg: err, status: 'error'});
            return err
        }

        this.props.appObject.status.append({msg: `Document ${filename}... `, style: 'regular'});
        if (availableOnPlatform()) {
            doc.remoteUrl = docInfo.chunkedUploadUri;
            this.props.appObject.status.append({msg: 'ok.', style: 'regular', append: true});
        } else if (docInfo.fileObj || docInfo.fileBlob) {
            // Upload document from local file system or fileBlob (file is in our VM).
            const msg = docInfo.fileBlob ? 'uploading document... ' : 'uploading new document... ';
            this.props.appObject.status.append({msg: msg, style: 'regular', append: true});
            let results = await this.uploadDoc(docInfo.filename)
            err = results.err;
            if(!err) {
                this.props.appObject.status.append({msg: 'done.', style: 'regular', append: true});
                doc.remoteUrl = results.chunkedUploadUri
            }
        } else if (docInfo.fileUrl) {
            // Fetch an example (assets) document then upload it.
            this.props.appObject.status.append({msg: 'uploading example document... ', style: 'regular', append: true});
            await this.fetchAndUpload(doc, docInfo)
        } else {
            // Set state so a ModalFace for re-uploading a single doc will be shown
            // Ask user to re-upload the document
            this.props.appObject.status.append({msg: 'waiting for upload... ', style: 'regular', append: true});
            err = 'WANT_UPLOAD'
        }
        return err
    }

    /**
     * The user added a file or an existing file needs to be re-uploaded. 
     * Either way, upload it to DocuSign
     * @param {string} filename the file to be uploaded 
     */
    async uploadDoc(filename) {
        const docInfo = this.state.documents.find (d => d.filename === filename);
        const blob = docInfo.fileBlob ? docInfo.fileBlob :
            new Blob([await docInfo.fileObj.arrayBuffer()], {type : "application/octet-stream"});
        //console.log(`filecontents:`);
        //console.log(await blob.text())
        const results = await this.uploadChunk(filename, blob)
            , err = results.err;
        if(!err) {
            this.props.appObject.docDropdownSet(this.state.documents);
        }
        return results
    }

    /**
     * Fetch the file from this app's file server, then upload it to the DS platform.
     * @param {*} doc 
     * @param {*} docInfo 
     */
    async fetchAndUpload(doc, docInfo) {
        try {
            let response = await fetch(docInfo.fileUrl)
            if (!response || response.status !== 200) {
                this.appObject.status.append({msg: `Could not fetch file ${docInfo.filename}. Please try again.`, style: 'error'});
                return;
            }
            // See https://stackoverflow.com/a/39951543/64904
            const fileBlob = await response.blob();
            const results = await this.uploadChunk(docInfo.filename, fileBlob);
            if (results.err) {return} // Error message already printed
            doc.remoteUrl = results.chunkedUploadUri;
            this.props.appObject.status.append({msg: 'done.', style: 'regular', append: true});
        } catch (e) {
            this.props.appObject.status.append({msg: `Could not fetch file ${docInfo.filename}`,
                msg2: `Error: ${e.toString()}. Please try again.`, style: 'error'});
        }
    }

    /**
     * Called to resume the upload of a new document after login has been completed
     */
    async resumeUpload() {
        const docInfo = this.state.documents.find (d => d.newDoc);
        this.props.appObject.status.set({msg: `Uploading ${docInfo.filename}... `, style: 'regular'});
        const results = await this.uploadDoc (docInfo.filename);
        if (results.err) {return} // Error message already printed
        this.props.appObject.status.append({msg: 'done.', style: 'regular', append: true});
        this.setState ({loadingDoc: false});
        if (this.state.reloadFile) {
            this.setState({reloadFile: null});
            await this.props.appObject.sendEnvelope(true);
        }
    }

    /**
     * Uses UploadChunk to upload the document to the DS platform.
     * SIDE EFFECT: Updates the documents collection with the chunkedUploadUri, timeout,
     *              and the FILE BLOB! -- So we're keeping the file contents locally.
     * @param {*} filename 
     * @param {*} fileBlob 
     */
    async uploadChunk(filename, fileBlob) {
        const results = await this.props.appObject.dsApi.uploadChunk(filename, fileBlob);
        if (results.err) {return results}
        // Add the results to the document object
        const newDocuments = this.state.documents.map(d => {
            if (d.filename !== filename) {return d}
            d.chunkedUploadId = results.chunkedUploadId;
            d.chunkedUploadUri = results.chunkedUploadUri;
            d.expirationDateTime = results.expirationDateTime;
            d.fileBlob = fileBlob;
            d.newDoc = false;
            return d
        })
        this.setState({documents: newDocuments})
        return results
    }

    /**
     * Reset documents' attributes if the doc is no longer available from the platform
     */
    postEnvelopeReq () {
        if (!chunkedUploadsAreOneTimeUse) {return} // No changes needed
        // reset the chunkedUpload attributes
        const newDocuments = this.state.documents.map(d => {
            d.chunkedUploadId = null;
            d.chunkedUploadUri = null;
            d.expirationDateTime = null;
            return d
        });
        this.setState({documents: newDocuments})
    }

    /**
     * Clear all but default documents
     */
    deleteItems () {
        this.setState({documents: this.props.defaultDocuments});
        // Update document dropdowns
        this.props.appObject.docDropdownSet(this.props.defaultDocuments);
    }
}

export default Documents;
