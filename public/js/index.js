/* eslint-disable */

import { displayMap } from './maptiler.js';
import { login, logout } from './login.js';
import { updateSetting } from './updateSetting.js';
import { bookTour } from './stripe.js';

// DOM ELEMENTS
const maptiler = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookTourBtn = document.getElementById("book-tour")



// DELEGATION
if (maptiler) {
    const locations = JSON.parse(maptiler.dataset.locations);
    displayMap(locations);
}

if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
}

if (logoutBtn) logoutBtn.addEventListener("click", logout)
if (userDataForm) {
    userDataForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const form = new FormData();
        form.append("name", document.getElementById("name").value);
        form.append("email", document.getElementById("email").value);
        form.append("photo", document.getElementById("photo").files[0]);
        updateSetting(form, "data");
    });
}
if (userPasswordForm) {
    userPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        document.querySelector(".btn--save-password").innerHTML = "Updating.......";
        const passwordCurrent = document.getElementById("password-current").value;
        const password = document.getElementById("password").value;
        const passwordConfirm = document.getElementById("password-confirm").value;
        await updateSetting({ password, passwordConfirm, passwordCurrent }, "password");

        document.querySelector(".btn--save-password").innerHTML = "Save password";
        document.getElementById("password-current").value = "";
        document.getElementById("password").value = "";
        document.getElementById("password-confirm").value = "";

    });
}


if (bookTourBtn) {
    bookTourBtn.addEventListener("click", async e => {
        e.target.innerHTML = "processing....";
        const { tourId } = e.target.dataset;
        await bookTour(tourId);
    })
}