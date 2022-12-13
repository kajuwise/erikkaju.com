import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-analytics.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyANq5z1rDvaUdp6cPe6yGidjaMZAxD2c3c",
    authDomain: "erikkajudotcom.firebaseapp.com",
    projectId: "erikkajudotcom",
    storageBucket: "erikkajudotcom.appspot.com",
    messagingSenderId: "625329843411",
    appId: "1:625329843411:web:249c559e86e8fe1b69b826",
    measurementId: "G-PSGEC7SHDD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const gaAnalytics = getAnalytics(app);
export const gaEvent = logEvent;