const alerts = [];

function notify(type, message) {
  const alert = { type, message, at: new Date().toISOString() };
  alerts.unshift(alert);
  console.log(`[NOTIFICATION STUB] ${type.toUpperCase()}: ${message}`);
  return alert;
}

function getAlerts() {
  return alerts;
}

module.exports = { notify, getAlerts };
