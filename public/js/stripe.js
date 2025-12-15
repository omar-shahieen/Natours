/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";
const stripe = new Stripe("pk_test_51SdpAEQ8TcO0mqMUFHWg63EuJFIuKQUHqGKpqUH5pfG0q5drthvLU5DlxhdYfnkmrI1Kh0kgVhpf0jNtk5wqes4t007JQ9gvFh");


export const bookTour = async tourId => {

    try {
        // get session from API
        const session = await axios(`http://localhost:3000/api/v1/booking/checkout-session/${tourId}`);

        console.log(session);
        //create checkout form + charge credit card

        window.location.href = session.data.session.url;


    } catch (err) {
        console.log(err);
        showAlert("error", error.response.data.message);
    }

}