/**
This is where your React app is connected to the real HTML page in the browser.

This is like Python's if __name__ == "__main__": - it starts
  your app.

What it does:
1. Finds the HTML element with id="root" in public/index.html
2. Tells React to render your top-level component (<App />) inside it
3. Wraps your app in any global providers (like React.StrictMode, Redux, Context, etc.)
 * 
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Finds the HTML element with id="root"
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // Development helper that checks for common mistakes
  // Example: deprecated API, double-invokes lifecycle
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
