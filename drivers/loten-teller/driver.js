'use strict';

const Homey = require('homey');
const { fetchOverviewFor } = require('../../lib/clubactie');

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

      const overview = await fetchOverviewFor(sellerId, loginCode);

      return {
        name: `${this.homey.__('pair.device_name_prefix')} - ${overview.personalizedInformation.sellerName}`,
        data: {
          id: `clubactie-${sellerId}`,
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
