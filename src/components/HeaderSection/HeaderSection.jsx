// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import './HeaderSection.css';
import { HeaderFace } from '../../UxFaces';

function HeaderSection(props) {
    // See https://github.docusignhq.com/pages/FrontEndShared/components/index.html#/header
    // props
    // accountId -- the short form
    // accountGuid
    // meToken
    // saveBadge -- if true, show red dot by the save item
    // 

    let appName = 'API Request Builder'
      , appId = 'EnvelopeBuilder' // 'ESign'
      , homeUrl = process.env.DS_APP_URL
      , apiRootUrl = `https://${process.env.DS_AUTH_SERVER}`
      ; 
      
    const oliveUx = (
        <div id="headerdiv">
            <HeaderFace
                appName={appName}
                appId={appId}
                homeUrl={homeUrl}
                meToken={props.meToken}
                accountId={props.accountId}
                accountGuid={props.accountGuid}
                onLogoff={props.onLogoff}
                apiRootUrl={apiRootUrl}
                tabItems={[
                    {itemId: "DIAGRAMS", text: "Diagrams",
                     subItems: [
                         {itemId: "DIAGRAM_OPEN" , text: "Open"    , onClick: props.openDiagramClicked },
                         {itemId: "DIAGRAM_SAVE" , text: "Save"    , onClick: props.saveDiagramClicked },
                         {itemId: "DIAGRAM_RESET", text: "Reset"   , onClick: props.resetDiagramClicked},
                        ]
                    },
                    {itemId: "EXAMPLES" , text: "Examples" , onClick: props.examplesClicked},
                    {itemId: "SAVE"     , text: "Save"     , onClick: props.saveDiagramClicked, showBadge: props.saveBadge},
                    {itemId: "DOCUMENTS", text: "Documents", onClick: props.documentsClicked},
                    {itemId: "VIDEOS"   , text: "Videos"   , onClick: props.videosClicked},
                ]}
                marketingButton={{text: "Send Envelope", onClick: props.sendEnvelopeClicked}}            
                showManageProfile={false}
                disableAnalytics={true}
                disableAppSwitching={true}
            />
        </div>
    );

    const bootstrapUx = (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Navbar.Brand href="">DocuSign | API Request Builder</Navbar.Brand>
            <Nav className="ml-5">
                <NavDropdown title="Diagrams" id="nav-diagrams">
                    <NavDropdown.Item onClick={props.openDiagramClicked} >Open </NavDropdown.Item>
                    <NavDropdown.Item onClick={props.saveDiagramClicked} >Save </NavDropdown.Item>
                    <NavDropdown.Item onClick={props.resetDiagramClicked}>Reset</NavDropdown.Item>
                </NavDropdown>
                <Nav.Link onClick={props.examplesClicked}   >Examples</Nav.Link>
                <Nav.Link onClick={props.saveDiagramClicked}>{props.saveBadge ? "Saveⱽⱽⱽ" : "Save"}</Nav.Link>
                <Nav.Link onClick={props.documentsClicked}  >Documents</Nav.Link>
                <Nav.Link onClick={props.videosClicked}     >Videos</Nav.Link>
                <Form className="ml-5" inline>
                  <Button variant="primary" onClick={props.sendEnvelopeClicked}>Send Envelope</Button>
                </Form>
            </Nav>
        </Navbar>
    );

    return props.oliveUx ? oliveUx : bootstrapUx;
}

export default HeaderSection;
