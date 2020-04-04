import axios from 'axios';
import { showAlert } from './alerts';
export const login = async (email, password) => {
    console.log(email, password);
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/login',
            data: {
                email,
                password,
            },
        });
        if (res.data.status === 'success') {
            showAlert('success', 'LogIn is successfully');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
        console.log(res);
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

export const logout = async (req, res) => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:3000/api/v1/users/logout',
        });
        if (res.data.status) location.reload(true);
        showAlert('success', 'Bye! See you next time!',10000);
    } catch (err) {
        showAlert('error', 'Error Logging Out! Try again.');
    }
};
