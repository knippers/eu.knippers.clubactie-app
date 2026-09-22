'use strict';

const Homey = require('homey');
const { HomeyAPI } = require('homey-api');

module.exports = class ClubactieApp extends Homey.App {

  async onInit() {
    this.log('Grote Clubactie - Loten Teller is gestart');

    try {
      this.homeyApi = await HomeyAPI.createAppAPI({ homey: this.homey });
    } catch (err) {
      this.error('Kon HomeyAPI niet initialiseren (widget device-matching werkt dan mogelijk niet):', err.message);
    }
  }

  /**
   * Wordt aangeroepen door de widget (zie app.json "widgets" > "api" > "getData",
   * en /widgets/loten-gauge/api.js).
   *
   * deviceId: de Homey-brede device-UUID die de widget doorgeeft via
   * Homey.getDeviceIds() (via de "devices" instelling in widget.compose.json).
   * Dit is NIET hetzelfde als onze eigen data.id ("clubactie-<sellerId>") -
   * daarom gebruiken we de Homey Web API (homey-api) om de UUID naar ons
   * eigen device terug te vertalen. Zonder match (of zonder deviceId) valt
   * terug op het eerste loten-teller apparaat.
   */
  async getWidgetData(deviceId) {
    const driver = this.homey.drivers.getDriver('loten-teller');
    const devices = driver.getDevices();

    let device = null;

    if (deviceId && this.homeyApi) {
      try {
        const webApiDevice = await this.homeyApi.devices.getDevice({ id: deviceId });
        if (webApiDevice && webApiDevice.data && webApiDevice.data.id) {
          device = devices.find((d) => d.getData().id === webApiDevice.data.id) || null;
        }
      } catch (err) {
        this.error('Kon device niet opzoeken via HomeyAPI:', err.message);
      }
    }

    if (!device) {
      device = devices[0] || null;
    }

    if (!device) {
      return { hasDevice: false };
    }

    return {
      hasDevice: true,
      naam: device.getName(),
      verkocht: device.getCapabilityValue('loten_verkocht') || 0,
      doel: device.getCapabilityValue('loten_doel') || 0,
      percentage: device.getCapabilityValue('loten_percentage') || 0,
    };
  }

};
