import React, { Component } from "react";
import Config from "./Config";

import BillingAPI from "./modules/BillingAPI";
import WeatherAPI from "./modules/WeatherAPI";

import "./App.css";

const APP_STATE_NOT_IFRAME = "not_iframe";
const APP_STATE_LOADING = "loading";
const APP_STATE_NOT_AUTHORIZED = "not_authorized";
const APP_STATE_ACCESS_DENIED = "access_denied";
const APP_STATE_ERROR = "error";
const APP_STATE_LOADED = "loaded";

const VISITOR_STATE_NOT_SELECTED = "not_selected";
const VISITOR_STATE_FETCHING = "fetching";
const VISITOR_STATE_FETCHED = "fetched";

const PAYMENT_STATUS_PAID = "paid";
const PAYMENT_STATUS_PROCESSED = "processed";
const PAYMENT_STATUS_ERROR = "error";

class App extends Component {
  state = {
    accessToken: null,
    appState: APP_STATE_LOADING,
    paymentStatus: null,
    visitor: {},
    weather: {}
  };

  fetchInterval = null;

  componentDidMount() {
    if (window.self === window.top) {
      this.setState({
        appState: APP_STATE_NOT_IFRAME
      });
      return false;
    }

    // initialize agent app extension
    // and skip default extension authorization
    window.LiveChat.init({
      authorize: false
    });

    window.LiveChat.on("customer_profile", data => {
      this.setState({
        visitor: data
      });
    });

    this.initApp();
  }

  async initApp() {
    this.accountsSdkInstance = window.AccountsSDK.init({
      client_id: Config.app_client_id,
      onIdentityFetched: async (error, data) => {
        if (error) {
          this.handleAuthError(error);
        } else {
          this.handleAuthSuccess(data.access_token, data.scopes);
        }
      }
    });
  }

  async handleAuthError(error) {
    console.warn(error);

    if (error.identity_exception === "unauthorized") {
      this.setState({
        appState: APP_STATE_NOT_AUTHORIZED
      });
    } else if (error.oauth_exception === "access_denied") {
      this.setState({
        appState: APP_STATE_ACCESS_DENIED
      });
    } else {
      this.setState({
        appState: APP_STATE_ERROR
      });
    }
  }

  async handleAuthSuccess(accessToken, scopes) {
    this.setState({
      accessToken: accessToken,
      hasBillingAccess: scopes.indexOf("billing_manage") > -1
    });

    await this.fetchCharges(accessToken);
    const paymentId = new URLSearchParams(document.location.search).get("id");
    if (paymentId) {
      await this.confirmPayment(accessToken, paymentId);
    }

    this.setState({
      appState: APP_STATE_LOADED,
      visitorState: VISITOR_STATE_NOT_SELECTED
    });
  }

  async fetchCharges(accessToken = this.state.accessToken) {
    BillingAPI.fetchCharges(accessToken)
      .then(response => {
        const paid = response.result.some(
          charge => charge.status === "success"
        );
        const processed = response.result.some(
          charge => charge.status === "processed"
        );

        this.setState({
          paymentStatus: paid
            ? PAYMENT_STATUS_PAID
            : processed ? PAYMENT_STATUS_PROCESSED : null
        });
      })
      .catch(error => {
        console.warn(error);

        this.setState({
          paymentStatus: PAYMENT_STATUS_ERROR
        });
      });
  }

  async confirmPayment(accessToken, paymentId) {
    BillingAPI.confirmPayment(accessToken, paymentId)
      .then(response => {
        let state = {
          visitorState: VISITOR_STATE_NOT_SELECTED
        };
        if (response.status && response.status === "processed") {
          state.paymentStatus = PAYMENT_STATUS_PROCESSED;
        }
        this.setState(state);
      })
      .catch(error => {
        console.warn(error);

        this.setState({
          visitorState: VISITOR_STATE_NOT_SELECTED
        });
      });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.visitor.id !== prevState.visitor.id) {
      this.setState({
        visitorState: VISITOR_STATE_FETCHING
      });

      WeatherAPI.fetchWeather(
        this.state.visitor.geolocation.latitude,
        this.state.visitor.geolocation.longitude
      )
        .then(response => {
          this.setState({
            visitorState: VISITOR_STATE_FETCHED,
            weather: {
              temperature: response.main.temp,
              icon: response.weather[0].icon
            }
          });
        })
        .catch(error => console.warn(error));
    }

    if (this.state.paymentStatus !== prevState.paymentStatus) {
      if (this.state.paymentStatus === PAYMENT_STATUS_PROCESSED) {
        // check if payment was successful every 15 seconds
        this.fetchInterval = setInterval(this.fetchCharges.bind(this), 15000);
      } else {
        clearInterval(this.fetchInterval);
      }
    }
  }

  handleBuyClick() {
    BillingAPI.createCharge(
      this.state.accessToken,
      Config.app_url,
      "Weather icon",
      125,
      1
    )
      .then(response => {
        window.location.href = response.confirmation_url;
      })
      .catch(error => console.warn(error));
  }

  render() {
    if (this.state.appState !== APP_STATE_LOADED) {
      return (
        <div className="App">
          {this.state.appState === APP_STATE_NOT_IFRAME && (
            <div>
              <p>
                This app is an{" "}
                <a href="https://docs.livechatinc.com/agent-app-extension/">
                  Agent App Extension
                </a>.{" "}
              </p>
              <p>
                <strong>
                  It cannot be opened directly in the browser window
                </strong>. It must be installed on your LiveChat account and
                loaded inside LiveChat agent app.{" "}
              </p>
              <p>To do this:</p>
              <ol>
                <li>
                  Create new app in{" "}
                  <a href="https://developers.livechatinc.com/console">
                    LiveChat Developers Console
                  </a>. Choose "Web app" as an app type.
                </li>
                <li>
                  In Authorization page, enter the address your app will be
                  deployed to ("Redirect URI whitelist" field). For example:
                  https://my-company.com/livechat-extension/
                </li>
                <li>
                  Check "offer in-app payments" scope from the "Access scopes"
                  list.
                </li>
                <li>
                  In Features, enter your "Plugin source URL" for Agent App
                  Extension feature. It should be the same as previous "Redirect
                  URI whitelist" value, for example:
                  https://my-company.com/livechat-extension/
                </li>
                <li>
                  Finally, in Distribution, install the app on your LiveChat
                  account.
                </li>
              </ol>
              <p>
                From now on, when you sign in to LiveChat agent app, you will
                see a new extension loaded in the right sidebar. This is your
                app!
              </p>
            </div>
          )}
          {this.state.appState === APP_STATE_LOADING && <p>Loading…</p>}
          {this.state.appState === APP_STATE_NOT_AUTHORIZED && (
            <div>
              <p>
                You must sign in with your LiveChat account before you can make
                a test purchase.
              </p>
              <div
                className="livechat-login-button"
                ref={ref => this.accountsSdkInstance.displayButtons()}
              />
            </div>
          )}
          {this.state.appState === APP_STATE_ACCESS_DENIED && (
            <div>
              <p>Access denied.</p>
              <p>
                Probably this application is installed on a different account
                and you do not have access to it.
              </p>
            </div>
          )}
          {this.state.appState === APP_STATE_ERROR && (
            <div>
              <p>
                Something is wrong. Check developer tools console to see error
                details.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (this.state.appState === APP_STATE_LOADED) {
      return (
        <div className="App">
          {this.state.visitorState === VISITOR_STATE_NOT_SELECTED && (
            <p>Please select a visitor.</p>
          )}
          {this.state.visitorState === VISITOR_STATE_FETCHING && (
            <p>Fetching…</p>
          )}

          {this.state.visitorState === VISITOR_STATE_FETCHED && (
            <ul className="visitor-details">
              <li>
                <strong>Visitor ID:</strong> {this.state.visitor.id}
              </li>
              <li>
                <strong>Visitor name:</strong> {this.state.visitor.name}
              </li>

              {this.state.weather.temperature && (
                <li>
                  <strong>Temperature:</strong> {this.state.weather.temperature}°C
                </li>
              )}
              {!this.state.hasBillingAccess && (
                <div>
                  <p>
                    "Buy now" button should be there, but it's only available to
                    your LiveChat account owner.
                  </p>
                  <p>You can still use the app, though.</p>
                </div>
              )}
              {this.state.hasBillingAccess &&
                this.state.weather.icon &&
                !this.state.paymentStatus && (
                  <li>
                    <hr />
                    Buy weather icon for <strong>$1.25!</strong>
                    <br />
                    <button onClick={this.handleBuyClick.bind(this)}>
                      Buy now
                    </button>
                  </li>
                )}

              {this.state.hasBillingAccess &&
                this.state.weather.icon &&
                this.state.paymentStatus === PAYMENT_STATUS_PROCESSED && (
                  <li>
                    <hr />
                    <span className="waiting-badge">waiting for payment…</span>
                  </li>
                )}

              {this.state.hasBillingAccess &&
                this.state.weather.icon &&
                this.state.paymentStatus === PAYMENT_STATUS_PAID && (
                  <li>
                    <strong>Weather icon:</strong>
                    <img
                      className="weather-icon"
                      src={`//openweathermap.org/img/w/${
                        this.state.weather.icon
                      }.png`}
                      alt=""
                    />

                    <span className="paid-badge">
                      <span role="img" aria-label="moneybag">
                        💰
                      </span>{" "}
                      paid
                    </span>
                  </li>
                )}
            </ul>
          )}
        </div>
      );
    }
  }
}

export default App;
