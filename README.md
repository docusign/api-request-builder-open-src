# API Request Builder
Open Source

## Installation

1. `npm install`
1. Configure two private CORS gateways, one for https://account-d.docusign.com, and one for https://demo.docusign.net

   See this [blog post](https://www.docusign.com/blog/dsdev-building-single-page-applications-with-docusign-and-cors-part-2) for more information and code examples.
1. Configure the `.env` file (See the `env.example` file.)
1. `npm start` (This takes several minutes! Very slow...)
1. `npm build` (Standard React build command.)

## Client id (Integration Key) settings
1. Enable `Implicit Grant`
1. Include a Redirect URI for `PUBLIC_URL/oauthResponse.html`
1. No secret is needed.

## Example diagrams
To add a new example diagram to the app, add the 
diagram to the src/assets/diagramExamples folder.

## The app's API 
The app can be started with a query parameter
to control the app.

### Load a specific example

Query parameter: `?eg=EXAMPLE_TITLE`

Where `EXAMPLE_TITLE` is the title of the example, with spaces and other characters encoded.

Example:

`http://localhost:3000/api-request-builder/build?eg=Require%20one%20of%20multiple%20checkboxes`

## Updating the Swagger file

1. Update the Swagger file stored in `/batch/esignature.rest.swagger-v2.1.json` from https://github.com/docusign/eSign-OpenAPI-Specification/

1. `npm run-script processSwagger`
1. Restart and test the application

## License
This software uses the MIT open source license. See the LICENSE file.

## Pull Requests
Pull requests that use the MIT license are welcomed.

## Issues / Questions
Please use the Issues page.
