import React from "react";
import { Alert, Linking } from "react-native";
import DeviceInfo from "react-native-device-info";
import apisauce from "apisauce";
import compareVersions from "compare-versions";

const createAPI = (baseURL = "https://itunes.apple.com/") => {
  const api = apisauce.create({
    baseURL,
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    timeout: 10000
  });

  return {
    getLatest: bundleId => api.get("lookup", { bundleId })
  };
};

const performCheck = () => {
  let updateIsAvailable = false;
  const api = createAPI();
  const bundleId = DeviceInfo.getBundleId();

  // Call API
  return api.getLatest(bundleId).then(response => {
    let latestInfo = null;
    // Did we get our exact result?

    if (response.ok && response.data.resultCount === 1) {
      latestInfo = response.data.results[0];
      const currentAppVersion = DeviceInfo.getVersion();
      const appStoreVersion = latestInfo.version;
      // check for version difference
      // updateIsAvailable = latestInfo.version !== DeviceInfo.getVersion();

      const result = compareVersions(currentAppVersion, appStoreVersion);
      updateIsAvailable = result === -1;
    }

    return { updateIsAvailable, ...latestInfo };
  });
};

const attemptUpgrade = appId => {
  // failover if itunes - a bit excessive
  const itunesURI = `itmss://itunes.apple.com/app/id${appId}?ls=1&mt=8`;
  const itunesURL = `https://itunes.apple.com/app/id${appId}?ls=1&mt=8`;

  Linking.canOpenURL(itunesURI).then(supported => {
    if (supported) {
      Linking.openURL(itunesURI);
    } else {
      Linking.openURL(itunesURL);
    }
  });
};

const showUpgradePrompt = (appId, version) => {
  Alert.alert(
    "Update Available",
    `There is an updated version available on the App Store.  Please update to version ${version} now`,
    [
      { text: "Upgrade", onPress: () => attemptUpgrade(appId) }
      // {text: 'Cancel'}
    ]
  );
};

const promptUser = () => {
  performCheck().then(sirenResult => {
    if (sirenResult.updateIsAvailable)
      showUpgradePrompt(sirenResult.trackId, sirenResult.version);
  });
};

export default {
  promptUser
};
