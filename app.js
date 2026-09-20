'use strict';

const Homey = require('homey');

module.exports = class ClubactieApp extends Homey.App {

  async onInit() {
    this.log('Grote Clubactie - Loten Teller is gestart');
  }

  /**
   * Wordt aangeroepen door de widget (zie app.json "widgets" > "api" > "getData",
   * en /widgets/loten-gauge/api.js).
   *
   * deviceId: de Homey device-id die in de widget-instellingen gekozen is
   * (via de "device" setting in app.json). Zonder deviceId (bv. widget nog
   * niet geconfigureerd) valt terug op het eerste loten-teller apparaat.
   */
  async getWidgetData(deviceId) {
    const driver = this.homey.drivers.getDriver('loten-teller');
    const devices = driver.getDevices();

    let device = null;
    if (deviceId) {
      device = devices.find((d) => d.getData().id === deviceId) || null;
    } else {
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
