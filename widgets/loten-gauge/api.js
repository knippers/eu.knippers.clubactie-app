'use strict';

module.exports = {
  async getData({ homey, query }) {
    const deviceId = query && query.deviceId ? query.deviceId : null;
    return homey.app.getWidgetData(deviceId);
  },
};
