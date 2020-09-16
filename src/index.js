// Copyright DocuSign, Inc. Ⓒ 2020. MIT License -- https://opensource.org/licenses/MIT
import React from 'react';
import ReactDOM from 'react-dom';
import './prism-vs.css';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

// Check that we're not at localhost:3000/ in development mode
// See https://stackoverflow.com/a/52857179/64904
function ReactIsInDevelomentMode(){ 
    return '_self' in React.createElement('div');
}

const homeUrl = process.env.DS_APP_URL
    , debugBadLocation = 'http://localhost:3000/'
    , location = window.location.href;
if (ReactIsInDevelomentMode() && location === debugBadLocation) {
    window.location = homeUrl
}

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
