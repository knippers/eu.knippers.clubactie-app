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
      // Probeer eerst te matchen op onze eigen custom data.id (clubactie-<sellerId>)
      device = devices.find((d) => d.getData().id === deviceId) || null;

      // Val terug op Homey's eigen systeembrede device-id, voor het geval
      // getDeviceIds() in de widget een ander soort ID teruggeeft dan onze
      // eigen data.id.
      if (!device) {
        device = devices.find((d) => d.id === deviceId) || null;
      }
    } else {
      device = devices[0] || null;
    }

    if (!device) {
      // Tijdelijke debug-info zodat we het exacte verschil kunnen zien
      // i.p.v. alleen "niet gevonden".
      return {
        hasDevice: false,
        debug: {
          requestedDeviceId: deviceId || null,
          availableDataIds: devices.map((d) => d.getData().id),
          availableHomeyIds: devices.map((d) => d.id),
        },
      };
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
