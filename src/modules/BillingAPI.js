import Config from "../Config";

class BillingAPI {
  createCharge(accessToken, appUrl, name, price, quantity) {
    return new Promise((resolve, reject) => {
      window
        .fetch(`${Config.billing_api_url}/v1/direct_charge`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          body: `return_url=${appUrl}&name=${encodeURIComponent(
            name
          )}&price=${price}&quantity=${quantity}&test=${
            Config.direct_charge_test ? "1" : "0"
          }`
        })
        .then(response => {
          if (response.status !== 201) {
            throw new Error(`Error: POST /v1/direct_charge`);
          }
          resolve(response.json());
        })
        .catch(error => reject(error));
    });
  }

  confirmPayment(accessToken, paymentId) {
    return new Promise((resolve, reject) => {
      window
        .fetch(
          `${Config.billing_api_url}/v1/direct_charge/${paymentId}/activate`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )
        .then(response => {
          if (response.status !== 200) {
            throw new Error(
              `Error: PUT /v1/direct_charge/${paymentId}/activate`
            );
          }
          resolve(response.json());
        })
        .catch(error => reject(error));
    });
  }

  fetchCharges(accessToken) {
    return new Promise((resolve, reject) => {
      window
        .fetch(`${Config.billing_api_url}/v1/direct_charge`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
        .then(response => {
          if (response.status !== 200) {
            throw new Error("Error: GET /v1/direct_charge");
          }
          resolve(response.json());
        })
        .catch(error => reject(error));
    });
  }
}

export default new BillingAPI();
