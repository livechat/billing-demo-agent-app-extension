An example LiveChat [Agent App Extension](https://docs.livechatinc.com/agent-app-extension/) using [LiveChat Billing API](https://docs.livechatinc.com/billing-api) to offer in-app payment.

The app shows current weather in website visitor's location. It also offers a payment of $1.25 for an additional feature: displaying the icon of the current weather.

<img src="./readme_assets/in-app-payment.png" width="500" />

## Installation

```
yarn install
yarn start
```

## How to use

This app is an [Agent App Extension](https://docs.livechatinc.com/agent-app-extension/).

It cannot be opened directly in the browser window. It must be installed on your LiveChat account and loaded inside LiveChat agent app.

To do this:

* Create new app in [LiveChat Developers Console](https://developers.livechatinc.com/console). Choose "Web app" as an app type.
* In Authorization page, enter the address your app will be deployed to ("Redirect URI whitelist" field). For example: https://my-company.com/livechat-extension/
* Copy the values of "Client Id" and "Redirect URI whitelist" to your app's config files (available in `/src/config/` directory).
* Check "offer in-app payments" scope from the "Access scopes" list.
* In Features, enter your "Plugin source URL" for Agent App Extension feature. It should be the same as previous "Redirect URI whitelist" value, for example: https://my-company.com/livechat-extension/
* Finally, in Distribution, install the app on your LiveChat account.

From now on, when you sign in to LiveChat agent app, you will see a new extension loaded in the right sidebar. This is your app!

Once your app is ready, you can offer it in the LiveChat Marketplace to all LiveChat customers. You can do this in the Distribution page in LiveChat Developers Console.

## Tech stack

[React](https://reactjs.org/) (via [create-react-app](https://github.com/facebookincubator/create-react-app))
