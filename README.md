# ECRWallet - An eCurrency Wallet

![](https://img.shields.io/github/license/ecurrency-project/ecrwallet.svg)

Thin eCurrency Wallet.
Built with React Native and Electrum.
Based on [BlueWallet](https://github.com/BlueWallet/BlueWallet).

<a href="https://play.google.com/store/apps/details?id=ecurrency.org.ecrwallet"><img alt="Get it on Google Play" src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" height="80"></a>

Website: [ecurrency.org](https://ecurrency.org/)

Community: [telegram group](https://t.me/ECReCurrency)

* Private keys never leave your device
* SegWit-first. Replace-By-Fee support
* Encryption. Plausible deniability
* And many more [features...](https://ecurrency.org/wallets)


## BUILD & RUN IT

Please refer to the engines field in package.json file for the minimum required versions of Node and npm. It is preferred that you use an even-numbered version of Node as these are LTS versions.

To view the version of Node and npm in your environment, run the following in your console:

```
node --version && npm --version
```

* In your console:

```
git clone https://github.com/ecurrency-project/ecrwallet.git
cd ecrwallet
npm install
```

Please make sure that your console is running the most stable versions of npm and node (even-numbered versions).

* To run on Android:

You will now need to either connect an Android device to your computer or run an emulated Android device using AVD Manager which comes shipped with Android Studio. To run an emulator using AVD Manager:

1. Download and run Android Studio
2. Click on "Open an existing Android Studio Project"
3. Open `build.gradle` file under `ecrwallet/android/` folder
4. Android Studio will take some time to set things up. Once everything is set up, go to `Tools` -> `AVD Manager`.
    * 📝 This option [may take some time to appear in the menu](https://stackoverflow.com/questions/47173708/why-avd-manager-options-are-not-showing-in-android-studio) if you're opening the project in a freshly-installed version of Android Studio.
5. Click on "Create Virtual Device..." and go through the steps to create a virtual device
6. Launch your newly created virtual device by clicking the `Play` button under `Actions` column

Once you connected an Android device or launched an emulator, run this:

```
npx react-native run-android
```

The above command will build the app and install it. Once you launch the app it will take some time for all of the dependencies to load. Once everything loads up, you should have the built app running.

* To run on iOS:

```
npx pod-install
npm start
```

In another terminal window within the ECRWallet folder:
```
npx react-native run-ios
```
**To debug ECRWallet on the iOS Simulator, you must choose a Rosetta-compatible iOS Simulator. This can be done by navigating to the Product menu in Xcode, selecting Destination Architectures, and then opting for "Show Both." This action will reveal the simulators that support Rosetta.
**

* To run on macOS using Mac Catalyst:

```
npx pod-install
npm start
```

Open ios/ECRWallet.xcworkspace. Once the project loads, select the scheme/target ECRWallet. Click Run.

## TESTS

```bash
npm run test
```


## LICENSE

MIT, see [LICENSE](LICENSE).

## WANT TO CONTRIBUTE?

Grab an issue from [the backlog](https://github.com/ecurrency-project/ecrwallet/issues), try to start or submit a PR, any doubts we will try to guide you. Contributors have a private telegram group, request access by email team@ecurrency.org

## RESPONSIBLE DISCLOSURE

Found critical bugs/vulnerabilities? Please email them
team@ecurrency.org
Thanks!
