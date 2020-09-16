// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
/**
 * dsEnvelopePlusJSON adds a fluent interface to the DocuSign API
 * It creates a JSON output 
 * @type {{}}
 */

import parents from "./parents.json";
import children from "./children.json";
import autoContainers from "./autoContainers.json";
import {snakeCase} from 'change-case'; // https://www.npmjs.com/package/change-case


// See https://stackoverflow.com/questions/48219415/method-chaining-in-a-javascript-class

class EnvelopePlusJSON {

    constructor() {
        this.envDef = {envelopeDefinition: {}}; // The JSON envelope definition
        this.envelopesCreateQP = {}; // Query Parameters for the Envelopes::create call
        this.createRecipientViewReq = {}; // Create recipient view request object
        this.objects = [{objName: 'envelopeDefinition', obj: this.envDef.envelopeDefinition}]; 
            // The array of objects added to the envelopeDefinition

        // Functions to be used for special blocks
        this.specialBlocks = {recipientViewRequest: this.add_RecipientViewRequest}
    }

    /**
     * Add a query parameter to the Envelopes::create call
     * @param {string} qpName query parameter name
     * @param {string} qpValue the value for the qp  
     * 
     */ 
    add_envQp(qpName, qpValue) {
        this.envelopesCreateQP[qpName] = qpValue;
        return this
    }

    /**
     * Add a scalar attribute to the Envelopes::create request obj
     * @param {string} attrName attribute name
     * @param {string} attrValue attribute value  
     * 
     */ 
    add_envDefAttribute(attrName, attrValue) {
        this.envDef.envelopeDefinition[attrName] = attrValue;
        return this
    }

    /**
     * Add a RecipientViewRequest
     * @param {object} attrObj an object holding the attributes 
     */
    add_RecipientViewRequest(attrObj) {
        this.envDef['createRecipientViewReq'] = attrObj
    }

    /**
     * Add an object to the envelope definition
     * @param {string} objName Name of the object 
     * @param {object} attributes Object holding the top level attributes
     */
    add_object(objName, objAttr) {
        /**
         * Strategy: examine the objName. Look in parents and this.objects
         * to see if there is a match of a parent object for the new object that is not
         * an autoContainer.
         * If not, try to use autoContainers to see if we can make one.
         * Else try again to insert but an existing autoContainer is ok.
         * Else the user is trying to add an object but it won't fit.
         */

        // First, is it a special block?
        if (this.specialBlocks[objName]) {
            this.specialBlocks[objName].call (this, objAttr);
            return this
        }

        const objParents = parents[objName];
        // Loop starting with the last object added to the envelopeDefinition
        let found = false;

        found = this._insertIntoOutput(objName, objAttr, false)
        if (!found) {
            // See which of the autoContainers can be a parent for objName.
            // For each of those autoContainers, see if they can be added to the envDef
            //
            // Filter: containers that can hold objName
            let localAutoContainers = autoContainers.filter(container => objParents[container])
            for (let i = 0; i < localAutoContainers.length; i++) {
                if (this._insertIntoOutput(localAutoContainers[i], {}, true)) {
                    // We were able to insert the autoContainer, now insert our object
                    found = this._insertIntoOutput(objName, objAttr, true)
                    break;
                }
            }
        }
        if (!found) {found = this._insertIntoOutput(objName, objAttr, true)}
        if (!found) {
            // This block can't be inserted
            let potentialParents = [];
            // Add parents that aren't autoContainers
            Object.keys(objParents).forEach(k => {
                if (!autoContainers.find(e => e === k)) {
                    potentialParents.push(k);
                }
            });
            // Filter: containers that can hold objName
            let localAutoContainers = autoContainers.filter(container => objParents[container]);
            // Add parents of autoContainers
            localAutoContainers.forEach(k => {
                potentialParents = potentialParents.concat(Object.keys(parents[k]))
            });
            const prettyBlockname = (b) => ("“" + snakeCase(b).replace(/_/g, ' ') + "”");
            potentialParents = potentialParents.map(v => prettyBlockname(v));
            const prettyNewBlock = prettyBlockname(objName);
            const msg = `Problem: Could not process block ${prettyNewBlock} in its current position. ` +
                (potentialParents.length === 1 ?
                     `The parent block ${potentialParents[0]} must be before the ${prettyNewBlock} block.`
                    : `One of the following parent blocks must be before the ${prettyNewBlock} block: ${potentialParents.join (", ")}.`);                        
            throw new Error (msg);
        }
        return this
    }

    _insertIntoOutput(name, attributes, autoContainerOk){
        const insertingAutoContainer = autoContainers.includes(name);
        let inserted = false;
        const localParents = parents[name];
        for (let i = this.objects.length - 1; i >= 0 ; i--) {
            if (this.objects[i].objName === name && insertingAutoContainer) {
                // We found the autocontainer we're trying to insert, so never mind! (Done.)
                return true; // EARLY RETURN
            }
            if (localParents[this.objects[i].objName] && 
                    (autoContainerOk || !autoContainers.includes(this.objects[i].objName) )) {
                const objParentName = this.objects[i].objName
                    , objParent = this.objects[i].obj
                    , attrName = children[objParentName][name].attribute
                    , attrStyle = children[objParentName][name].style
                    ;
                if (attrStyle === "object" && !objParent[attrName]) { // don't overwrite existing
                    inserted = true;
                    objParent[attrName] = attributes;
                    this.objects.push({objName: name, obj: objParent[attrName]});
                    break               
                } else if (attrStyle === "arrayOfObject") {
                    inserted = true;
                    if (!objParent[attrName]) {objParent[attrName] = []}
                    const newLen = objParent[attrName].push(attributes);
                    this.objects.push({objName: name, obj: objParent[attrName][newLen - 1]});
                    break               
                } else if (attrStyle === "arrayOfScalar") {
                    inserted = true;
                    // attributes is an array...
                    if (!objParent[attrName]) {objParent[attrName] = []}
                    objParent[attrName] = objParent[attrName].concat(attributes);
                    this.objects.push({objName: name, obj: objParent[attrName]});
                    break               
                }
            }
        }
        return inserted
    }


    /**
     * returns the JSON output of the object:
     * {envelopeDefinition:     // The JSON envelope definition
     *  envelopesCreateQP:      // Query Parameters for the Envelopes::create call
     *  createRecipientViewReq: // Create recipient view request object
     * }
     */
    getJSON() {
        return {
                envelopeDefinition: this.envDef.envelopeDefinition,
                 envelopesCreateQP: this.envelopesCreateQP,
            createRecipientViewReq: this.envDef.createRecipientViewReq
        }
    }
}
export { EnvelopePlusJSON };