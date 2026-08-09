const PDFDocument = require('pdfkit');

function money(n) {
  const value = Number(n || 0);
  return (
    'Rs. ' +
    value.toLocaleString('en-IN', {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2
    })
  );
}

function buildInvoicePDF(order, items, user) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  doc.fontSize(24).font('Helvetica-Bold').fillColor('#1c1917').text('BookNook', { continued: false });
  doc.fontSize(10).font('Helvetica').fillColor('#78716c').text('Online Bookstore - Invoice');

  doc.moveDown(1.5);
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#1c1917').text(`Invoice #${String(order.id).padStart(4, '0')}`);
  doc.fontSize(10).font('Helvetica').fillColor('#44403c')
    .text(`Date: ${order.created_at}`)
    .text(`Customer: ${user.name} (${user.email})`);

  doc.moveDown(1);
  const tableTop = doc.y;
  const cols = { title: 50, qty: 330, unit: 400, total: 470 };

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1c1917');
  doc.text('Item', cols.title, tableTop);
  doc.text('Qty', cols.qty, tableTop);
  doc.text('Unit Price', cols.unit, tableTop);
  doc.text('Total', cols.total, tableTop);
  doc.moveTo(50, tableTop + 16).lineTo(545, tableTop + 16).strokeColor('#d6d3d1').stroke();

  let y = tableTop + 30;
  doc.font('Helvetica').fillColor('#292524');
  for (const item of items) {
    doc.fontSize(10).text(item.title, cols.title, y);
    doc.text(String(item.quantity), cols.qty, y);
    doc.text(money(item.price_at_purchase), cols.unit, y);
    doc.text(money(item.quantity * item.price_at_purchase), cols.total, y);
    y += 22;
  }

  doc.moveTo(50, y).lineTo(545, y).strokeColor('#d6d3d1').stroke();
  y += 16;
  const subtotal = items.reduce((s, it) => s + it.quantity * it.price_at_purchase, 0);

  doc.fontSize(11);
  doc.fillColor('#44403c').text('Subtotal', 380, y);
  doc.fillColor('#1c1917').text(money(subtotal), cols.total, y);
  y += 20;
  if (order.discount_amount > 0) {
    doc.fillColor('#b91c1c').text(`Coupon (${order.coupon_code})`, 380, y);
    doc.text(`-${money(order.discount_amount)}`, cols.total, y);
    y += 20;
  }
  doc.moveTo(380, y - 10).lineTo(545, y - 10).strokeColor('#d6d3d1').stroke();
  doc.font('Helvetica-Bold').fillColor('#1c1917').text('Total', 380, y);
  doc.text(money(order.total_amount), cols.total, y);
  y += 34;

  doc.font('Helvetica').fontSize(9).fillColor('#78716c')
    .text(`Order status: ${order.status}`, 50, y)
    .moveDown(0.5)
    .text('Thank you for shopping with BookNook!');

  doc.end();
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

module.exports = { buildInvoicePDF };
