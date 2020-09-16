Using the API Request Builder's Node.JS program output
===================================================

1. Install and unzip the Node.JS API Request Builder framework files,
   including this file.
2. You will need Node.JS (at least version 8.10) and npm.
3. In the NodeJS_example directory, run:
      npm install
4. Use the API Request Builder: switch to the Node.JS output,
   test your diagram, and then use the COPY TO CLIPBOARD button.
5. Next, open the index.js file and replace ALL of its
   contents by pasting the program from the Envelope
   Builder into the file.
6. Execute the program by running
      npm start

Notes:
1. If your program includes any views, such as the embedded
   signer view, then you MUST immediately open the URL
   in a browser. It is only good for a limited time.
2. The example program from the API Request Builder includes
   an access token that is only good for 8 hours from the
   time you logged into DocuSign via the API Request Builder.

   For production, use an OAuth flow.

   For further testing, you can obtain a new token by
   using the Token Generator Tool from the Developer 
   Center. 
   See https://developers.docusign.com/oauth-token-generator