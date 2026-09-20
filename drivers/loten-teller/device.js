'use strict';

const Homey = require('homey');
const { fetchOverviewFor } = require('../../lib/clubactie');

const POLL_INTERVAL_MS = 5 * 60 * 1000; // elke 5 minuten

module.exports = class LotenTellerDevice extends Homey.Device {

  async onInit() {
    await this.poll();
    this.pollInterval = this.homey.setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }

  async onUninit() {
    if (this.pollInterval) this.homey.clearInterval(this.pollInterval);
  }

  async poll() {
    try {
      const { sellerId, loginCode } = this.getSettings();
      const overview = await fetchOverviewFor(sellerId, loginCode);

      const verkocht = overview.ticketAmounts.totalSalesAmount;
      const doel = overview.ticketAmounts.targetAmount;
      const percentage = doel > 0 ? Math.round((verkocht / doel) * 100) : 0;

      const vorigeVerkocht = this.getCapabilityValue('loten_verkocht');

      await this.setCapabilityValue('loten_verkocht', verkocht).catch(this.error);
      await this.setCapabilityValue('loten_doel', doel).catch(this.error);
      await this.setCapabilityValue('loten_percentage', percentage).catch(this.error);

      if (vorigeVerkocht !== null && vorigeVerkocht !== undefined && vorigeVerkocht !== verkocht) {
        const trigger = this.driver.getVerkochtTrigger();
        await trigger
          .trigger(
            this,
            { verkocht, doel, percentage, vorige_waarde: vorigeVerkocht },
            {},
          )
          .catch(this.error);
      }

      await this.setAvailable().catch(this.error);
    } catch (err) {
      this.error('Poll mislukt:', err.message);
      await this.setUnavailable(err.message).catch(this.error);
    }
  }

};
