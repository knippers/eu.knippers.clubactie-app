'use strict';

const Homey = require('homey');
const { login, getOverview } = require('../../lib/clubactie');

module.exports = class LotenTellerDriver extends Homey.Driver {

  async onInit() {
    this._verkochtTrigger = this.homey.flow.getDeviceTriggerCard('verkocht_gewijzigd');
  }

  getVerkochtTrigger() {
    return this._verkochtTrigger;
  }

  async onPair(session) {
    session.setHandler('login', async ({ sellerId, loginCode }) => {
      if (!sellerId || !loginCode) {
        throw new Error(this.homey.__('pair.missing_fields'));
      }

      const bearerToken = await login(sellerId, loginCode);
      const overview = await getOverview(bearerToken);

      return {
        name: `${this.homey.__('pair.device_name_prefix')} - ${overview.personalizedInformation.sellerName}`,
        data: {
          id: `clubactie-${sellerId}`,
        },
        // Token uit de pairing meegeven zodat de eerste poll niet opnieuw inlogt.
        store: {
          bearerToken,
          tokenObtainedAt: Date.now(),
        },
        settings: {
          sellerId: String(sellerId),
          loginCode: String(loginCode),
        },
        capabilities: ['loten_verkocht', 'loten_doel', 'loten_percentage'],
      };
    });
  }

};
