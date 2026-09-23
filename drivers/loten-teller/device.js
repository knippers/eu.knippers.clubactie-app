'use strict';

const Homey = require('homey');
const { login, getOverview } = require('../../lib/clubactie');

const POLL_INTERVAL_MS = 5 * 60 * 1000; // elke 5 minuten

// Het login token is 8 uur geldig; we hergebruiken het maximaal 6 uur zodat
// er ruim marge is voordat het verloopt.
const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;

module.exports = class LotenTellerDevice extends Homey.Device {

  async onInit() {
    await this.poll();
    this.pollInterval = this.homey.setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }

  async onUninit() {
    if (this.pollInterval) this.homey.clearInterval(this.pollInterval);
  }

  async onSettings({ changedKeys }) {
    // Andere inloggegevens -> gecachet token is niet meer bruikbaar.
    if (changedKeys.includes('sellerId') || changedKeys.includes('loginCode')) {
      await this.clearToken();
      this.homey.setTimeout(() => this.poll(), 0);
    }
  }

  /**
   * Geeft een geldig bearer token terug. Het token wordt per device in de
   * device store bewaard (blijft dus ook bewaard na een herstart van de app)
   * en maximaal TOKEN_TTL_MS hergebruikt.
   */
  async getToken({ forceRefresh = false } = {}) {
    const token = this.getStoreValue('bearerToken');
    const obtainedAt = this.getStoreValue('tokenObtainedAt');

    if (!forceRefresh && token && obtainedAt && Date.now() - obtainedAt < TOKEN_TTL_MS) {
      return token;
    }

    const { sellerId, loginCode } = this.getSettings();
    const newToken = await login(sellerId, loginCode);
    await this.setStoreValue('bearerToken', newToken).catch(this.error);
    await this.setStoreValue('tokenObtainedAt', Date.now()).catch(this.error);
    this.log('Nieuw login token opgehaald');
    return newToken;
  }

  async clearToken() {
    await this.unsetStoreValue('bearerToken').catch(this.error);
    await this.unsetStoreValue('tokenObtainedAt').catch(this.error);
  }

  async fetchOverview() {
    const token = await this.getToken();
    try {
      return await getOverview(token);
    } catch (err) {
      // Token toch ongeldig (bijv. eerder ingetrokken): eenmalig opnieuw inloggen.
      if (err.statusCode === 401 || err.statusCode === 403) {
        this.log('Token geweigerd, opnieuw inloggen');
        const freshToken = await this.getToken({ forceRefresh: true });
        return getOverview(freshToken);
      }
      throw err;
    }
  }

  async poll() {
    try {
      const overview = await this.fetchOverview();

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
