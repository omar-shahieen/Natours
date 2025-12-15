/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";



export const updateSetting = async (data, type) => {
    try {
        const url = type == "data" ? `http://localhost:3000/api/v1/users/updateMe` : `http://localhost:3000/api/v1/users/updateMyPassword`;
        const res = await axios({
            method: "PATCH",
            url,
            data
        })
        if (res.data.status == "success") {
            showAlert("success", "Data Updated Successfully");

        }
    } catch (error) {
        showAlert("error", error.response.data.message);

    }

}
