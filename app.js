'use strict';

const Homey = require('homey');
const { HomeyAPI } = require('homey-api');

module.exports = class ClubactieApp extends Homey.App {

  async onInit() {
    this.log('Grote Clubactie - Loten Teller is gestart');

    try {
      this.homeyApi = await HomeyAPI.createAppAPI({ homey: this.homey });
      this.log('[widget-debug] HomeyAPI succesvol geinitialiseerd');
    } catch (err) {
      this.error('[widget-debug] Kon HomeyAPI niet initialiseren:', err.message);
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
    this.log('[widget-debug] getWidgetData aangeroepen met deviceId=', deviceId);

    const driver = this.homey.drivers.getDriver('loten-teller');
    const devices = driver.getDevices();
    this.log('[widget-debug] eigen devices (data.id):', devices.map((d) => d.getData().id));

    let device = null;

    if (deviceId && this.homeyApi) {
      try {
        const webApiDevice = await this.homeyApi.devices.getDevice({ id: deviceId });
        this.log('[widget-debug] webApiDevice gevonden:', webApiDevice ? {
          name: webApiDevice.name,
          data: webApiDevice.data,
        } : null);

        if (webApiDevice && webApiDevice.data && webApiDevice.data.id) {
          device = devices.find((d) => d.getData().id === webApiDevice.data.id) || null;
          this.log('[widget-debug] match op data.id=', webApiDevice.data.id, '-> gevonden:', !!device);
        } else {
          this.log('[widget-debug] webApiDevice.data.id ontbreekt, kan niet matchen');
        }
      } catch (err) {
        this.error('[widget-debug] Kon device niet opzoeken via HomeyAPI:', err.message);
      }
    } else if (deviceId && !this.homeyApi) {
      this.log('[widget-debug] deviceId aanwezig maar this.homeyApi is niet beschikbaar');
    }

    if (!device) {
      this.log('[widget-debug] geen match, val terug op devices[0]');
      device = devices[0] || null;
    }

    if (!device) {
      return { hasDevice: false };
    }

    this.log('[widget-debug] uiteindelijk gebruikt device:', device.getName());

    return {
      hasDevice: true,
      naam: device.getName(),
      verkocht: device.getCapabilityValue('loten_verkocht') || 0,
      doel: device.getCapabilityValue('loten_doel') || 0,
      percentage: device.getCapabilityValue('loten_percentage') || 0,
    };
  }

};
