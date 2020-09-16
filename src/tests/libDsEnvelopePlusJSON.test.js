// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import {EnvelopePlusJSON} from '../lib/dsEnvelopePlusJSON';

it('Fluent to JSON', () => {
    let docusign = {EnvelopePlusJSON};
    const fluent = `
    new docusign.EnvelopePlusJSON()  
    .add_envDefAttribute("emailSubject", "Please sign the attached document")
    .add_envDefAttribute("status", "sent")
    .add_object("document", {
        filename: "anchorfields.pdf",
        name: "Example document", 
        fileExtension: "pdf", 
        documentId: "1"
    })
    .add_object("signer", {
        email: "signer_email@example.com", 
        name: "Signer's name", 
        recipientId: "1", 
        clientUserId: "1000"
    })
    .add_object("signHere", {
        anchorString: "/sig1/", 
        anchorXOffset: "20", 
        anchorUnits: "pixels"
    })
    .add_object("recipientViewRequest", {
        returnUrl: "https://docusign.com", 
        authenticationMethod: "none", 
        clientUserId: "1000", 
        email: "signer_email@example.com", 
        userName: "Signer's name"
    })
`;
  const expectedJson = 
`{
    "envelopeDefinition": {
        "emailSubject": "Please sign the attached document",
        "status": "sent",
        "documents": [
            {
                "filename": "anchorfields.pdf",
                "name": "Example document",
                "fileExtension": "pdf",
                "documentId": "1"
            }
        ],
        "recipients": {
            "signers": [
                {
                    "email": "signer_email@example.com",
                    "name": "Signer's name",
                    "recipientId": "1",
                    "clientUserId": "1000",
                    "tabs": {
                        "signHereTabs": [
                            {
                                "anchorString": "/sig1/",
                                "anchorXOffset": "20",
                                "anchorUnits": "pixels"
                            }
                        ]
                    }
                }
            ]
        }
    },
    "envelopesCreateQP": {},
    "createRecipientViewReq": {
        "returnUrl": "https://docusign.com",
        "authenticationMethod": "none",
        "clientUserId": "1000",
        "email": "signer_email@example.com",
        "userName": "Signer's name"
    }
}`;
  const json = JSON.stringify(eval(fluent).getJSON(), null, 4);
  expect(json).toEqual(expectedJson);
});

