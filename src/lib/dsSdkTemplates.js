// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
/**
 * dsSdkTemplates are used to convert JSON constructs into 
 * code for different DocuSign SDKs.
 * 
 * This file is used by dsJsonToSdk.js
 */

import {pascalCase, snakeCase, camelCase} from 'change-case'; // https://www.npmjs.com/package/change-case
/* eslint import/no-webpack-loader-syntax: off */
import NodeJSTemplate from '!!raw-loader!../assets/sdkExamples/NodeJSTemplate.js.txt';
import PHPTemplate from '!!raw-loader!../assets/sdkExamples/PHPTemplate.php.txt';
import VBTemplate from '!!raw-loader!../assets/sdkExamples/VBTemplate.vb.txt';
import CSharpTemplate from '!!raw-loader!../assets/sdkExamples/CSharpTemplate.cs.txt';
import JavaTemplate from '!!raw-loader!../assets/sdkExamples/JavaTemplate.java.txt';
import PythonTemplate from '!!raw-loader!../assets/sdkExamples/PythonTemplate.py.txt';
import RubyTemplate from '!!raw-loader!../assets/sdkExamples/RubyTemplate.rb.txt';

const supportedLanguages = {NodeJS: true, PHP: true, VB: true, CSharp: true,
    Java: true, Python: true, Ruby: true};
const jsonLanguages = {VB: true};
const templates = {NodeJS: NodeJSTemplate, PHP: PHPTemplate, VB: VBTemplate,
        CSharp: CSharpTemplate, Java: JavaTemplate, Python: PythonTemplate,
        Ruby: RubyTemplate};
const transformRules = {
    PHP: {var: {format: 'snake', prefix: '$'},
          obj: {format: 'pascal'},
          attr: {format: 'snake', prefix: "'", postfix: "'"},
    },
    CSharp: {var: {format: 'camel', prefix: ''},
         obj: {format: 'pascal'},
         attr: {format: 'pascal', prefix: "", postfix: ""},
    },
    Java: {var: {format: 'camel', prefix: ''},
        obj: {format: 'pascal'},
        attr: {format: 'pascal', prefix: "", postfix: ""},
    },
    Python: {var: {format: 'snake', prefix: ''},
        obj: {format: 'pascal'},
        attr: {format: 'snake', prefix: "", postfix: ""},
    },
    Ruby: {var: {format: 'snake', prefix: ''},
        obj: {format: 'pascal'},
        attr: {format: 'camel', prefix: ":", postfix: ""},
    }
 }
const transforms = {snake: snakeCase, pascal: pascalCase, camel: camelCase}
const extMimeTable = {pdf: "application/pdf", html: "text/html", htm: "text/html",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        doc: "application/msword", png: "image/png", jpeg: "image/jpeg", jpg: "image/jpeg",
        ppt: "application/vnd.ms-powerpoint", rtf: "application/rtf",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation"}

class DsSdkTemplates {

    constructor(appObject, sdkLanguage) {
        this.appObject = appObject;
        this.supported = supportedLanguages[sdkLanguage];
        this.wantsJSON = jsonLanguages[sdkLanguage];
        this.sdkLanguage = sdkLanguage;
        if (!this.supported) {return}; // EARLY return

        // this.t are the templates for the language
        this.t = this[sdkLanguage]();
        this.template = templates[sdkLanguage];
        if (this.template === "templateMock.txt") {
            // for testing
            this.template = "{{envelope_definition}}\n\n\n{{recipient_view_request}}"
        }
        this.setup();
    }

    /**
     * @returns {string} mime designation for the file type
     * @param {string} ext 
     */
    convertExtMime(ext) {
        return extMimeTable[ext || "pdf"]
    }

    /**
     * @returns string the transformed variable name
     * @param {*} transformRule 
     * @param {string} vName 
     */
    transformVar(transformRule, vName) {
        const rule = transformRule.var
            , format = rule.format
            , prefix = rule.prefix
            , result = prefix + transforms[format](vName)
            ;
        return result
    }
    /**
     * @returns string the transformed SDK object name
     * @param {*} transformRule 
     * @param {string} vName 
     */
    transformObj(transformRule, objName) {
        const rule = transformRule.obj
            , format = rule.format
            , result = transforms[format](objName)
            ;
        return result
    }
    /**
     * @returns string the transformed attribute ref for setting the attribute
     * @param {*} transformRule 
     * @param {string} vName 
     */
    transformAttrName(transformRule, attrName) {
        const rule = transformRule.attr
            , format = rule.format
            , prefix = rule.prefix
            , postfix = rule.postfix
            , result = prefix + transforms[format](attrName) + postfix
            ;
        return result
    }

    /**
     * Take care of the basics: accountId, accessToken, dates
     */
    setup() {
        this.template = this.template.replace(/{{generated}}/g, new Date().toUTCString());
        this.template = this.template.replace(/{{generated_year}}/g, new Date().getFullYear());
        this.template = this.template.replace('{{access_token}}', this.appObject.accessToken || "");
        this.template = this.template.replace('{{account_id}}', this.appObject.accountId || "");
    }

    /**
     * Setters for template items 
     */
    setEnvelopeDefinition(envelopeDefinition) {
        this.template = this.template.replace('{{envelope_definition}}', envelopeDefinition)
    }
    setRecipientViewRequest(recipientViewRequest) {
        this.t.setRecipientViewRequest(recipientViewRequest)
    }

    /**
     * Returns the {array, arrayOfString, object} object for Node.JS
     */
    NodeJS() {
        /**
         * Update template with recipient_view_request and
         * handle the false case too.
         * @param {*} recipientViewRequest 
         */ 
        const indent = "    ";
        const setRecipientViewRequest = recipientViewRequest => {
            if (!recipientViewRequest) {
                recipientViewRequest = "    let recipientViewRequest = false;"
            }
            this.template = this.template.replace(
                '{{recipient_view_request}}', recipientViewRequest)
        }
    
        /**
         * Write out Node.js code for an array assigned to a variable
         * 
         * Handlebars version:
         *     let {{{var}}} = [{{#each items}}{{{this}}}{{#if @last}}{{else}}, {{/if}}{{/each}}];
         * 
         * @param {string} vName The variable's name 
         * @param {*} objName The name of the variables object type
         * @param {*} items  The items in the array
         */
        const arrayFunction = (args) => {
            const {var: vName, items} = args;

            const itemsFormatted = items.map ((v, i, a) => 
                `${v}${i === a.length - 1 ? '' : ', '}`)
            return `${indent}let ${vName} = [${itemsFormatted.join('')}];`
        }

        /**
         * Write out Node.js code for an array of strings assigned to a variable
         * 
         * Handlebars version:
         *         let {{{var}}} = [{{#each items}}{{{escapeString this}}}{{#if @last}}{{else}}, {{/if}}{{/each}}];
         * 
         * @param {string} vName The variable's name 
         * @param {string} objName The name of the variables object type
         * @param {array} items  The items in the array
         */
        const arrayOfStringsFunction = (args) => {
            const {var: vName, items} = args;

            const itemsFormatted = items.map ((v, i, a) => 
                `${JSON.stringify(v)}${i === a.length - 1 ? '' : ', '}`)
            return `${indent}let ${vName} = [${itemsFormatted.join('')}];`
        }

        /**
         * Write out Node.js code for an object (associative array) 
         * assigned to a variable
         * 
         * Handlebars version:
         *     let {{{var}}} = docusign.{{{objectName}}}.constructFromObject({
         *          {{#each attributeInfo}}
         *          {{{attr}}}: {{#if scalar}}{{#if (eq type "string")}}{{{escapeString value}}}{{else}}{{{value}}}{{/if}}{{else}}{{{varName}}}{{/if}}{{#if @last}}{{else}},{{/if}}
         *     {{/each}}
         *     });
         * 
         * 
         * @param {string} vName The variable's name 
         * @param {string} objName The name of the variable's object type
         * @param {string} sdkObjectName The name of the variable's object type for the SDK.
         *                               May need an additional transformation. Eg to Pascal Case
         * @param {array} attributeInfos Array of attributeInfo
         *                  Each attributeInfo = {attr, type, scalar, value}
         *                  attr -- attribute name
         *                  type -- the type of the attribute
         *                  scalar -- true/false
         *                  value -- value of the attribute
         *                  varName -- name of the variable for the attribute's value   
         */
        const objectFunction = (args) => {
            const {var: vName, sdkObjectName, attributeInfo: attributeInfos} = args;
            const realSdkObjectName = pascalCase(sdkObjectName);
            const out1 = `${indent}let ${vName} = docusign.${realSdkObjectName}.constructFromObject({\n`
                , attributes = attributeInfos.map((v, i, a) => {
                        if (v.docFilename) {
                            // make a function call to get the doc in Base64 format
                            // Also, no longer a scalar -- use varName
                            v.scalar = false;
                            v.varName = `await readDocFileB64("${v.docFilename}")`
                        }
                        return `${indent}${indent}${v.attr}: ${v.scalar ? (v.type === 'string' ? JSON.stringify(v.value) : v.value) : v.varName}${i === a.length - 1 ? '' : ', '} ${v.comment ? ('// ' + v.comment):''}\n`
                    }
                  ).join('')
                , out2 = `${indent}${indent}});`
                ;
            return out1 + attributes + out2 
        }

        return {setRecipientViewRequest: setRecipientViewRequest,
                array: arrayFunction, 
                arrayOfString: arrayOfStringsFunction, 
                object: objectFunction,
            }
    }

    /**
     * Returns the {array, arrayOfString, object} object for PHP
     */
    PHP() {
        /**
         * Update template with recipient_view_request and
         * handle the false case too.
         * @param {*} recipientViewRequest 
         */ 
        const indent = "    ";
        const setRecipientViewRequest = recipientViewRequest => {
            if (!recipientViewRequest) {
                recipientViewRequest = "    $recipient_view_request = FALSE;"
            }
            this.template = this.template.replace(
                '{{recipient_view_request}}', recipientViewRequest)
        }
    
        const transformRule = transformRules.PHP;
        /**
         * Write out code for an array assigned to a variable
         * 
         * @param {string} vName The variable's name 
         * @param {*} objName The name of the variables object type
         * @param {*} items  The items in the array
         */
        const arrayFunction = (args) => {
            let {var: vName, items} = args;
            vName = this.transformVar(transformRule, vName);

            const itemsFormatted = items.map ((v, i, a) => 
                `${this.transformVar(transformRule, v)}${i === a.length - 1 ? '' : ', '}`)
            return `${indent}${vName} = [${itemsFormatted.join('')}];`
        }

        /**
         * Write out code for an array of strings assigned to a variable
         * 
         * @param {string} vName The variable's name 
         * @param {string} objName The name of the variables object type
         * @param {array} items  The items in the array
         */
        const arrayOfStringsFunction = (args) => {
            let {var: vName, items} = args;
            vName = this.transformVar(transformRule, vName);

            const itemsFormatted = items.map ((v, i, a) => 
                `${JSON.stringify(v)}${i === a.length - 1 ? '' : ', '}`)
            return `${indent}${vName} = [${itemsFormatted.join('')}];`
        }

        /**
         * Write out code for an object (associative array) 
         * assigned to a variable
         * 
         * Handlebars version:
         *     let {{{var}}} = docusign.{{{objectName}}}.constructFromObject({
         *          {{#each attributeInfo}}
         *          {{{attr}}}: {{#if scalar}}{{#if (eq type "string")}}{{{escapeString value}}}{{else}}{{{value}}}{{/if}}{{else}}{{{varName}}}{{/if}}{{#if @last}}{{else}},{{/if}}
         *     {{/each}}
         *     });
         * 
         * 
         * @param {string} vName The variable's name 
         * @param {string} objName The name of the variable's object type
         * @param {string} sdkObjectName The name of the variable's object type for the SDK.
         *                               May need an additional transformation. Eg to Pascal Case
         * @param {array} attributeInfos Array of attributeInfo
         *                  Each attributeInfo = {attr, type, scalar, value}
         *                  attr -- attribute name
         *                  type -- the type of the attribute
         *                  scalar -- true/false
         *                  value -- value of the attribute
         *                  varName -- name of the variable for the attribute's value   
         */
        const objectFunction = (args) => {
            let {var: vName, sdkObjectName, attributeInfo: attributeInfos} = args;
            vName = this.transformVar(transformRule, vName);
            const realSdkObjectName = this.transformObj(transformRule, sdkObjectName);
            const out1 = `${indent}${vName} = new \\DocuSign\\eSign\\Model\\${realSdkObjectName}([\n`
                , attributes = attributeInfos.map((v, i, a) => {
                        if (v.docFilename) {
                            // make a function call to get the doc in Base64 format
                            // Also, no longer a scalar -- use varName
                            v.scalar = false;
                            v.varName = `base64_encode(file_get_contents($docs_path.'${v.docFilename}'))`
                        } else {
                            if (v.varName) {v.varName = this.transformVar(transformRule, v.varName)}
                        }
                        const attrName = this.transformAttrName(transformRule, v.attr);
                        return `${indent}${indent}${attrName} => ${v.scalar ? (v.type === 'string' ? JSON.stringify(v.value) : v.value) : v.varName}${i === a.length - 1 ? '' : ', '} ${v.comment ? ('# ' + v.comment):''}\n`
                    }
                  ).join('')
                , out2 = `${indent}${indent}]);`
                ;
            return out1 + attributes + out2 
        }

        return {setRecipientViewRequest: setRecipientViewRequest,
                array: arrayFunction, 
                arrayOfString: arrayOfStringsFunction, 
                object: objectFunction,
            }
    }


    /**
     * Returns the {array, arrayOfString, object} object for Python
     */
    Python() {
        /**
         * Update template with recipient_view_request and
         * handle the false case too.
         * @param {*} recipientViewRequest 
         */ 
        const indent = "    ";
        const setRecipientViewRequest = recipientViewRequest => {
            if (!recipientViewRequest) {
                recipientViewRequest = "    recipient_view_request = False"
            }
            this.template = this.template.replace(
                '{{recipient_view_request}}', recipientViewRequest)
        }
    
        const transformRule = transformRules.Python;
        /**
         * Write out code for an array assigned to a variable
         * 
         * @param {string} vName The variable's name 
         * @param {*} objName The name of the variables object type
         * @param {*} items  The items in the array
         */
        const arrayFunction = (args) => {
            let {var: vName, items} = args;
            vName = this.transformVar(transformRule, vName);

            const itemsFormatted = items.map ((v, i, a) => 
                `${this.transformVar(transformRule, v)}${i === a.length - 1 ? '' : ', '}`)
            return `${indent}${vName} = [${itemsFormatted.join('')}]`
        }

        /**
         * Write out code for an array of strings assigned to a variable
         * 
         * @param {string} vName The variable's name 
         * @param {string} objName The name of the variables object type
         * @param {array} items  The items in the array
         */
        const arrayOfStringsFunction = (args) => {
            let {var: vName, items} = args;
            vName = this.transformVar(transformRule, vName);

            const itemsFormatted = items.map ((v, i, a) => 
                `${JSON.stringify(v)}${i === a.length - 1 ? '' : ', '}`)
            return `${indent}${vName} = [${itemsFormatted.join('')}]`
        }

        /**
         * Write out code for an object (associative array) 
         * assigned to a variable
         * 
         * Handlebars version:
         *     let {{{var}}} = docusign.{{{objectName}}}.constructFromObject({
         *          {{#each attributeInfo}}
         *          {{{attr}}}: {{#if scalar}}{{#if (eq type "string")}}{{{escapeString value}}}{{else}}{{{value}}}{{/if}}{{else}}{{{varName}}}{{/if}}{{#if @last}}{{else}},{{/if}}
         *     {{/each}}
         *     });
         * 
         * 
         * @param {string} vName The variable's name 
         * @param {string} objName The name of the variable's object type
         * @param {string} sdkObjectName The name of the variable's object type for the SDK.
         *                               May need an additional transformation. Eg to Pascal Case
         * @param {array} attributeInfos Array of attributeInfo
         *                  Each attributeInfo = {attr, type, scalar, value}
         *                  attr -- attribute name
         *                  type -- the type of the attribute
         *                  scalar -- true/false
         *                  value -- value of the attribute
         *                  varName -- name of the variable for the attribute's value   
         */
        const objectFunction = (args) => {
            let {var: vName, sdkObjectName, attributeInfo: attributeInfos} = args;
            vName = this.transformVar(transformRule, vName);
            const realSdkObjectName = this.transformObj(transformRule, sdkObjectName);
            const out1 = `${indent}${vName} = docusign.${realSdkObjectName}(\n`
                , attributes = attributeInfos.map((v, i, a) => {
                        if (v.docFilename) {
                            // make a function call to get the doc in Base64 format
                            // Also, no longer a scalar -- use varName
                            v.scalar = false;
                            v.varName = `read_doc_file_base64("${v.docFilename}")`
                        } else {
                            if (v.varName) {v.varName = this.transformVar(transformRule, v.varName)}
                        }
                        const attrName = this.transformAttrName(transformRule, v.attr);
                        return `${indent}${indent}${attrName} = ${v.scalar ? (v.type === 'string' ? JSON.stringify(v.value) : v.value) : v.varName}${i === a.length - 1 ? '' : ', '} ${v.comment ? ('# ' + v.comment):''}\n`
                    }
                  ).join('')
                , out2 = `${indent}${indent})`
                ;
            return out1 + attributes + out2 
        }

        return {setRecipientViewRequest: setRecipientViewRequest,
                array: arrayFunction, 
                arrayOfString: arrayOfStringsFunction, 
                object: objectFunction,
            }
    }


    /**
     * Returns the {array, arrayOfString, object} object for Ruby
     */
    Ruby() {
        /**
         * Update template with recipient_view_request and
         * handle the false case too.
         * @param {*} recipientViewRequest 
         */ 
        const indent = "    ";
        const setRecipientViewRequest = recipientViewRequest => {
            if (!recipientViewRequest) {
                recipientViewRequest = "    recipient_view_request = false"
            }
            this.template = this.template.replace(
                '{{recipient_view_request}}', recipientViewRequest)
        }
    
        const transformRule = transformRules.Ruby;
        /**
         * Write out code for an array assigned to a variable
         * 
         * @param {string} vName The variable's name 
         * @param {*} objName The name of the variables object type
         * @param {*} items  The items in the array
         */
        const arrayFunction = (args) => {
            let {var: vName, items} = args;
            vName = this.transformVar(transformRule, vName);

            const itemsFormatted = items.map ((v, i, a) => 
                `${this.transformVar(transformRule, v)}${i === a.length - 1 ? '' : ', '}`)
            return `${indent}${vName} = [${itemsFormatted.join('')}]`
        }

        /**
         * Write out code for an array of strings assigned to a variable
         * 
         * @param {string} vName The variable's name 
         * @param {string} objName The name of the variables object type
         * @param {array} items  The items in the array
         */
        const arrayOfStringsFunction = (args) => {
            let {var: vName, items} = args;
            vName = this.transformVar(transformRule, vName);

            const itemsFormatted = items.map ((v, i, a) => 
                `${JSON.stringify(v)}${i === a.length - 1 ? '' : ', '}`)
            return `${indent}${vName} = [${itemsFormatted.join('')}]`
        }

        /**
         * Write out code for an object (associative array) 
         * assigned to a variable
         * 
         * Handlebars version:
         *     let {{{var}}} = docusign.{{{objectName}}}.constructFromObject({
         *          {{#each attributeInfo}}
         *          {{{attr}}}: {{#if scalar}}{{#if (eq type "string")}}{{{escapeString value}}}{{else}}{{{value}}}{{/if}}{{else}}{{{varName}}}{{/if}}{{#if @last}}{{else}},{{/if}}
         *     {{/each}}
         *     });
         * 
         * 
         * @param {string} vName The variable's name 
         * @param {string} objName The name of the variable's object type
         * @param {string} sdkObjectName The name of the variable's object type for the SDK.
         *                               May need an additional transformation. Eg to Pascal Case
         * @param {array} attributeInfos Array of attributeInfo
         *                  Each attributeInfo = {attr, type, scalar, value}
         *                  attr -- attribute name
         *                  type -- the type of the attribute
         *                  scalar -- true/false
         *                  value -- value of the attribute
         *                  varName -- name of the variable for the attribute's value   
         */
        const objectFunction = (args) => {
            let {var: vName, sdkObjectName, attributeInfo: attributeInfos} = args;
            vName = this.transformVar(transformRule, vName);
            const realSdkObjectName = this.transformObj(transformRule, sdkObjectName);
            const out1 = `${indent}${vName} = DocuSign_eSign::${realSdkObjectName}.new({\n`
                , attributes = attributeInfos.map((v, i, a) => {
                        if (v.docFilename) {
                            // make a function call to get the doc in Base64 format
                            // Also, no longer a scalar -- use varName
                            v.scalar = false;
                            v.varName = `Base64.encode64(File.binread("${v.docFilename}"))`
                        } else {
                            if (v.varName) {v.varName = this.transformVar(transformRule, v.varName)}
                        }
                        const attrName = this.transformAttrName(transformRule, v.attr);
                        return `${indent}${indent}${attrName} => ${v.scalar ? (v.type === 'string' ? JSON.stringify(v.value) : v.value) : v.varName}${i === a.length - 1 ? '' : ', '} ${v.comment ? ('# ' + v.comment):''}\n`
                    }
                  ).join('')
                , out2 = `${indent}${indent}})`
                ;
            return out1 + attributes + out2 
        }

        return {setRecipientViewRequest: setRecipientViewRequest,
                array: arrayFunction, 
                arrayOfString: arrayOfStringsFunction, 
                object: objectFunction,
            }
    }


    /**
     * VisualBasic
     */
    VB() {
        /**
         * Update template with recipient_view_request and
         * handle the false case too.
         * @param {*} recipientViewRequest 
         */ 
        const indent = "    ";
        const lineIndent = "        ";            
        /**
         * Since this template uses JSON, this method handles both the 
         * envelopeDefinition and the recipientViewRequest
         * @param {string} jsonArg 
         */
        const convertJSONFunction = (jsonArg) => {
            const json = JSON.parse(JSON.stringify(jsonArg)) // local copy
                , envelopeDefinition = json.envelopeDefinition || json
                , documentObjs = this.appObject.dsApi.findDocuments(envelopeDefinition)
                , documents = documentObjs.map(v => 
                    ({mimeType: this.convertExtMime(v.fileExtension), filename: v.name, 
                      documentId: v.documentId, diskFilename: v.filename}))
                , documentsLastIndex = documents.length - 1
                ;
            documentObjs.forEach(e => {delete e.filename});
            
            // Goal:
            // Dim documents = {
            // (mimeType:="application/pdf", filename:="Example document", documentId:="1", diskFilename:="anchorfields.pdf")
            // }
            let vbDocuments = [`${lineIndent}Dim documents = {`];
            documents.forEach((v, i) => {
                vbDocuments.push(`${lineIndent}${indent}(mimeType:="${v.mimeType}", ` +
                    `filename:="${v.filename}", documentId:="${v.documentId}", ` +
                    `diskFilename:="${v.diskFilename}")${i === documentsLastIndex ? "" : ","}`
                )
            })
            vbDocuments.push(`${lineIndent}}`);

            let j = JSON.stringify(envelopeDefinition, null, indent);
            j = j.replace (/"/g, '""'); // Double the quotes for VB strings
            j = j.replace (/\{/g, '{{'); // Double the braces for VB interpolated strings
            j = j.replace (/\}/g, '}}'); // Double the braces for VB interpolated strings

            const out = `${lineIndent}Dim envelopeDefinition As String = $"${j}"` +
                    `\n${vbDocuments.join("\n")}`;
            this.setEnvelopeDefinition(out);

            // Next, handle createRecipientViewReq
            let viewReq = [];
            viewReq.push(
                `${lineIndent}Dim doRecipientView As Boolean = ${json.createRecipientViewReq ? "True" : "False"}`);
            if (json.createRecipientViewReq) {
                j = JSON.stringify(json.createRecipientViewReq, null, indent);
                j = j.replace (/"/g, '""'); // Double the quotes for VB strings
                j = j.replace (/\{/g, '{{'); // Double the braces for VB interpolated strings
                j = j.replace (/\}/g, '}}'); // Double the braces for VB interpolated strings
                viewReq.push(`${lineIndent}Dim recipientViewRequest As String = $"${j}"`);
                this.template = this.template.replace(
                    '{{recipient_view_request}}', viewReq.join("\n"))
            }
        }

        return {convertJSON: convertJSONFunction}
    }

    /**
     * Returns the {array, arrayOfString, object} object for C#
     */
    CSharp() {
        /**
         * Update template with recipient_view_request and
         * handle the false case too.
         * @param {*} recipientViewRequest 
         */ 
        const indent = "\t";
        const lineIndent = "\t\t\t";
        const setRecipientViewRequest = recipientViewRequest => {
            const out1 =
                `${lineIndent}bool doRecipientView = ${recipientViewRequest ? "true" : "false"};\n`;
            this.template = this.template.replace(
                '{{recipient_view_request}}', out1 + recipientViewRequest)
        }
    
        const transformRule = transformRules.CSharp;
        /**
         * Write out code for an array of objs assigned to a variable
         * 
         * @param {string} vName The variable's name 
         * @param {*} objName The name of the variables object type
         * @param {*} items  The items in the array
         */
        const arrayFunction = (args) => {
            let {var: vName, objName, items} = args;
            vName = this.transformVar(transformRule, vName);
            objName = this.transformObj(transformRule, objName);

            const itemsFormatted = items.map ((v, i, a) => 
                `${this.transformVar(transformRule, v)}${i === a.length - 1 ? '' : ', '}`)
            return `${lineIndent}List<${objName}> ${vName} = new List<${objName}> {${itemsFormatted.join('')}};`
        }

        /**
         * Write out code for an array of strings assigned to a variable
         * 
         * @param {string} vName The variable's name 
         * @param {string} objName The name of the variables object type
         * @param {array} items  The items in the array
         */
        const arrayOfStringsFunction = (args) => {
            let {var: vName, items} = args;
            vName = this.transformVar(transformRule, vName);

            const itemsFormatted = items.map ((v, i, a) => 
                `${JSON.stringify(v)}${i === a.length - 1 ? '' : ', '}`)
            return `${lineIndent}List<String> ${vName} = new List<String> {${itemsFormatted.join('')}};`
            }

        /**
         * Write out code for an object (associative array) 
         * assigned to a variable
         * 
         * @param {string} vName The variable's name 
         * @param {string} objName The name of the variable's object type
         * @param {string} sdkObjectName The name of the variable's object type for the SDK.
         *                               May need an additional transformation. Eg to Pascal Case
         * @param {array} attributeInfos Array of attributeInfo
         *                  Each attributeInfo = {attr, type, scalar, value}
         *                  attr -- attribute name
         *                  type -- the type of the attribute
         *                  scalar -- true/false
         *                  value -- value of the attribute
         *                  varName -- name of the variable for the attribute's value   
         */
        const objectFunction = (args) => {
            let {var: vName, sdkObjectName, attributeInfo: attributeInfos} = args;
            vName = this.transformVar(transformRule, vName);
            const realSdkObjectName = this.transformObj(transformRule, sdkObjectName);
            const out1 = `${lineIndent}${realSdkObjectName} ${vName} = new ${realSdkObjectName}
${lineIndent}{\n`
                , attributes = attributeInfos.map((v, i, a) => {
                        if (v.docFilename) {
                            // make a function call to get the doc in Base64 format
                            // Also, no longer a scalar -- use varName
                            v.scalar = false;
                            v.varName = `ReadContent("${v.docFilename}")`
                        } else {
                            if (v.varName) {v.varName = this.transformVar(transformRule, v.varName)}
                        }
                        const attrName = this.transformAttrName(transformRule, v.attr);
                        const val = v.value ? `"${v.value.replace (/"/g, '""')}"` : null; // Double the quotes for strings
                        return `${lineIndent}${indent}${attrName} = ${v.scalar ? (v.type === 'string' ? val : v.value) : v.varName}${i === a.length - 1 ? '' : ', '} ${v.comment ? ('// ' + v.comment):''}\n`
                    }
                  ).join('')
                , out2 = `${lineIndent}};`
                ;
            return out1 + attributes + out2 
        }

        return {setRecipientViewRequest: setRecipientViewRequest,
                array: arrayFunction, 
                arrayOfString: arrayOfStringsFunction, 
                object: objectFunction,
            }
    }

    /**
     * Returns the {array, arrayOfString, object} object for Java
     */
    Java() {
        /**
         * Update template with recipient_view_request and
         * handle the false case too.
         * @param {*} recipientViewRequest 
         */ 
        const lineIndent = "        ";
        const setRecipientViewRequest = recipientViewRequest => {
            const out1 =
                `${lineIndent}Boolean doRecipientView = Boolean.${recipientViewRequest ? "TRUE" : "FALSE"};\n`;
            this.template = this.template.replace(
                '{{recipient_view_request}}', out1 + recipientViewRequest)
        }
    
        const transformRule = transformRules.Java;
        /**
         * Write out code for an array of objs assigned to a variable
         * 
         * @param {string} vName The variable's name 
         * @param {*} objName The name of the variables object type
         * @param {*} items  The items in the array
         */
        const arrayFunction = (args) => {
            let {var: vName, objName, items} = args;
            vName = this.transformVar(transformRule, vName);
            objName = this.transformObj(transformRule, objName);

            const itemsFormatted = items.map ((v, i, a) => 
                `${this.transformVar(transformRule, v)}${i === a.length - 1 ? '' : ', '}`)
            return `${lineIndent}List<${objName}> ${vName} = Arrays.asList(${itemsFormatted.join('')});`
        }

        /**
         * Write out code for an array of strings assigned to a variable
         * 
         * @param {string} vName The variable's name 
         * @param {string} objName The name of the variables object type
         * @param {array} items  The items in the array
         */
        const arrayOfStringsFunction = (args) => {
            let {var: vName, items} = args;
            vName = this.transformVar(transformRule, vName);

            const itemsFormatted = items.map ((v, i, a) => 
                `${JSON.stringify(v)}${i === a.length - 1 ? '' : ', '}`)
            return `${lineIndent}List<String> ${vName} = Arrays.asList(${itemsFormatted.join('')});`
            }

        /**
         * Write out code for an object (associative array) 
         * assigned to a variable
         * 
         * @param {string} vName The variable's name 
         * @param {string} objName The name of the variable's object type
         * @param {string} sdkObjectName The name of the variable's object type for the SDK.
         *                               May need an additional transformation. Eg to Pascal Case
         * @param {array} attributeInfos Array of attributeInfo
         *                  Each attributeInfo = {attr, type, scalar, value}
         *                  attr -- attribute name
         *                  type -- the type of the attribute
         *                  scalar -- true/false
         *                  value -- value of the attribute
         *                  varName -- name of the variable for the attribute's value   
         */
        const objectFunction = (args) => {
            let {var: vName, sdkObjectName, attributeInfo: attributeInfos} = args;
            vName = this.transformVar(transformRule, vName);
            const realSdkObjectName = this.transformObj(transformRule, sdkObjectName);
            const out1 = ` \n${lineIndent}${realSdkObjectName} ${vName} = new ${realSdkObjectName}();\n`
                , attributes = attributeInfos.map((v, i, a) => {
                        if (v.docFilename) {
                            // make a function call to get the doc in Base64 format
                            // Also, no longer a scalar -- use varName
                            v.scalar = false;
                            v.varName = `readContentB64("${v.docFilename}")`
                        } else {
                            if (v.varName) {v.varName = this.transformVar(transformRule, v.varName)}
                        }
                        const attrName = this.transformAttrName(transformRule, v.attr);
                        const val = v.value ? `"${v.value.replace (/"/g, '""')}"` : null; // Double the quotes for strings
                        return `${lineIndent}${vName}.set${attrName}(${v.scalar ? (v.type === 'string' ? val : v.value) : v.varName});  ${v.comment ? ('// ' + v.comment):''}\n`
                    }
                  ).join('')
                , out2 = ``
                ;
            return out1 + attributes + out2 
        }

        return {setRecipientViewRequest: setRecipientViewRequest,
                array: arrayFunction, 
                arrayOfString: arrayOfStringsFunction, 
                object: objectFunction,
            }
    }

}
export { DsSdkTemplates }
