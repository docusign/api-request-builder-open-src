// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT

import {EnvelopePlusJSON} from '../lib/dsEnvelopePlusJSON';
import {JsonToSdk} from '../lib/dsJsonToSdk';
import fs from 'fs-extra'
import path from 'path'
import { textSpanContainsPosition } from 'typescript';

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
const docusign = {EnvelopePlusJSON};
const json = eval(fluent).getJSON();
const appObjMock = {dsApi: {findDocuments: () => []}};
const snapshotsDir = "src/tests/__snapshots__";

const langs = ["NodeJS", "PHP", "VB", "CSharp", "Java", "Python", "Ruby"];
test.each (langs) (
    "%p language test",
    async (lang) => {
        const snapshotName = `${lang}.snap.txt`
            , langOut = new JsonToSdk(appObjMock, lang).convert(json)
            , snapshotPath = path.join(snapshotsDir, snapshotName)
            ;
        // ONLY while recording snapshots:
        //await fs.writeFile(snapshotPath, langOut);
        expect(langOut).toEqual(await fs.readFile(snapshotPath, 'utf8'));
        }
);

