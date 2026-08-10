const bcrypt = require('bcryptjs');
const path = require('path');
const { db, initSchema } = require(path.join(__dirname, 'database'));

initSchema();

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const insertUser = db.prepare(
  'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
);
const insertAuthor = db.prepare('INSERT INTO authors (name, bio) VALUES (?, ?)');
const insertPublisher = db.prepare('INSERT INTO publishers (name) VALUES (?)');
const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
const insertBook = db.prepare(
  `INSERT INTO books (title, author_id, publisher_id, category_id, isbn, price, stock_qty, description, cover_image_url, sample_pdf_url)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertCoupon = db.prepare(
  'INSERT INTO coupons (code, discount_percent, valid_until, active) VALUES (?, ?, ?, ?)'
);
const insertOrder = db.prepare(
  'INSERT INTO orders (user_id, status, total_amount, discount_amount, coupon_code) VALUES (?, ?, ?, ?, ?)'
);
const insertOrderItem = db.prepare(
  'INSERT INTO order_items (order_id, book_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)'
);
const insertReview = db.prepare(
  'INSERT INTO reviews (user_id, book_id, rating, comment, verified_purchase) VALUES (?, ?, ?, ?, 1)'
);
const insertCartItem = db.prepare('INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?, ?, ?)');
const insertWishlistItem = db.prepare('INSERT INTO wishlist_items (user_id, book_id) VALUES (?, ?)');
const PASSWORD = 'Password@123';
const admin = insertUser.run('Admin User', 'admin@bookstore.com', bcrypt.hashSync('Admin@123', 10), 'admin');
const john = insertUser.run('John Carter', 'john@example.com', bcrypt.hashSync(PASSWORD, 10), 'customer');
const jane = insertUser.run('Jane Miller', 'jane@example.com', bcrypt.hashSync(PASSWORD, 10), 'customer');

const authors = {
  amelia: insertAuthor.run('Amelia Hartwell', 'Award-winning novelist known for atmospheric coastal fiction.'),
  jonathan: insertAuthor.run('Jonathan Pierce', 'Mystery writer with a love for foggy city streets and old maps.'),
  maya: insertAuthor.run('Maya Chen', 'Physicist turned science communicator.'),
  robert: insertAuthor.run('Robert Aldridge', 'Historian specialising in ancient civilisations.'),
  sofia: insertAuthor.run('Sofia Ramirez', 'Startup mentor and business columnist.'),
  david: insertAuthor.run('David Okafor', 'Security engineer and API design consultant.'),
  eleanor: insertAuthor.run('Eleanor Whitmore', 'Environmental journalist and non-fiction author.'),
  rajesh: insertAuthor.run('Rajesh Menon', 'Software architect and productivity researcher.'),
  claire: insertAuthor.run('Claire Dubois', 'French novelist and brand strategist.'),
  henry: insertAuthor.run('Henry Blackwood', 'Author of sweeping historical narratives.'),
  priya: insertAuthor.run('Priya Sharma', 'Cognitive psychologist writing about habits and mindfulness.'),
  thomas: insertAuthor.run('Thomas Keller', 'Database specialist and SQL educator.')
};

const publishers = ['Bluebird Press', 'Northwind Books', 'Silverleaf Publishing', 'Cedar Lane Press', 'Harbinger House', 'Willow & Quill', 'Summit Publishing', 'Crimson Ink'].map((name) => insertPublisher.run(name).lastInsertRowid);

const categories = ['Fiction', 'Science', 'Technology', 'Business', 'History', 'Self-Help'].map((name) => insertCategory.run(name).lastInsertRowid);
const [FICTION, SCIENCE, TECH, BUSINESS, HISTORY, SELF_HELP] = categories;

const books = [
  ['The Last Lighthouse Keeper', 'amelia', 0, FICTION, '978-1-110001-01-1', 499, 42, 'When the last lighthouse keeper on the Northern coast retires, a storm uncovers a secret that was supposed to stay buried with the tide.'],
  ['Whispers of the Old Canal', 'jonathan', 1, FICTION, '978-1-110001-02-8', 349, 30, 'A canal-side murder, a stolen diary, and a detective chasing echoes through the old quarter of the city.'],
  ['The Glass Hourglass', 'maya', 2, FICTION, '978-1-110001-03-5', 549, 3, 'A mysterious hourglass grants its owner the past - but every grain of sand comes at a price.'],
  ['Letters from Prague', 'claire', 3, FICTION, '978-1-110001-04-2', 449, 25, 'An archivist uncovers a cache of love letters that rewrite a family history across two wars.'],
  ['The Midnight Bakery', 'eleanor', 4, FICTION, '978-1-110001-05-9', 479, 12, 'A bakery that only opens at midnight, and the baker who bakes memories into every loaf.'],
  ['A Winter in Venice', 'henry', 5, FICTION, '978-1-110001-06-6', 579, 8, 'An art historian loses her memory in a flood and must piece together a vanished painting - and her own past.'],
  ['The Mapmaker\'s Daughter', 'sofia', 6, FICTION, '978-1-110001-07-3', 449, 19, 'In a city that redraws its streets overnight, a mapmaker\'s daughter must find her way home.'],
  ['Shadows Over Soho', 'jonathan', 7, FICTION, '978-1-110001-08-0', 399, 4, 'A series of vanishings in Soho leads an inspector into a shadow society that exists between the streetlights.'],
  ['Quantum Realms: A Beginner\'s Journey', 'maya', 2, SCIENCE, '978-1-110002-01-8', 899, 15, 'A gentle, story-driven introduction to quantum mechanics for curious readers.'],
  ['The Secret Life of Microbes', 'david', 1, SCIENCE, '978-1-110002-02-5', 749, 21, 'How invisible organisms shape our bodies, our food, and our planet.'],
  ['Cosmic Dust: Origins of Everything', 'amelia', 5, SCIENCE, '978-1-110002-03-2', 819, 9, 'From stardust to planets - the astonishing story of where the atoms in your body came from.'],
  ['The Neuroscience of Dreams', 'rajesh', 0, SCIENCE, '978-1-110002-04-9', 699, 17, 'Why we dream, what dreams mean for memory, and what the sleeping brain can teach us about the waking one.'],
  ['Oceans in Crisis', 'eleanor', 3, SCIENCE, '978-1-110002-05-6', 649, 2, 'A journalist\'s urgent report from the world\'s warming seas and the scientists fighting to save them.'],
  ['The Hidden Universe', 'maya', 7, SCIENCE, '978-1-110002-06-3', 869, 11, 'Dark matter, dark energy, and the 95% of the universe we cannot see.'],
  ['Modern Web Development with React', 'rajesh', 6, TECH, '978-1-110003-01-5', 1199, 25, 'A practical, project-based guide to building fast, modern web apps with React and modern tooling.'],
  ['SQL Mastery: From Novice to Expert', 'thomas', 1, TECH, '978-1-110003-02-2', 1049, 32, 'Master queries, joins, indexing and optimisation - the complete path to SQL fluency.'],
  ['Designing Secure APIs', 'david', 2, TECH, '978-1-110003-03-9', 1099, 3, 'Threat modelling, authentication, and hardening for developers building production APIs.'],
  ['Cloud Architecture Patterns', 'thomas', 6, TECH, '978-1-110003-04-6', 1249, 14, 'Proven architectural patterns for scalable, resilient cloud systems.'],
  ['AI for Everyday Developers', 'maya', 7, TECH, '978-1-110003-05-3', 1149, 18, 'Practical machine learning for software developers who build products, not papers.'],
  ['The Art of Clean Code', 'rajesh', 0, TECH, '978-1-110003-06-0', 949, 27, 'Readability, naming, refactoring, and the habits that separate good code from great code.'],
  ['Database Design Principles', 'thomas', 1, TECH, '978-1-110003-07-7', 1079, 4, 'Normalisation, entity relationships, and the thinking behind well-designed schemas.'],
  ['The Startup Playbook', 'sofia', 6, BUSINESS, '978-1-110004-01-2', 799, 22, 'From idea to first revenue - a battle-tested guide for founders.'],
  ['Negotiate Like a Pro', 'henry', 5, BUSINESS, '978-1-110004-02-9', 629, 16, 'The tactics, psychology, and scripts behind successful negotiations in business and life.'],
  ['Financial Intelligence for Beginners', 'thomas', 0, BUSINESS, '978-1-110004-03-6', 699, 12, 'Understand the numbers behind any business and read financial statements with confidence.'],
  ['The Remote Work Revolution', 'david', 1, BUSINESS, '978-1-110004-04-3', 599, 20, 'How distributed teams build culture, focus, and high performance - anywhere in the world.'],
  ['Brand Building in the Digital Age', 'claire', 2, BUSINESS, '978-1-110004-05-0', 729, 9, 'A modern playbook for brands that want to be remembered, not just seen.'],
  ['Data-Driven Decision Making', 'sofia', 7, BUSINESS, '978-1-110004-06-7', 829, 7, 'Turn raw data into decisions: metrics, dashboards, and the biases to watch out for.'],
  ['The Silk Road: A Thousand Years of Trade', 'henry', 1, HISTORY, '978-1-110005-01-9', 679, 18, 'The merchants, empires, and ideas that travelled the greatest trade route in history.'],
  ['Empires of the Ancient World', 'robert', 0, HISTORY, '978-1-110005-02-6', 789, 13, 'How six ancient civilisations rose, ruled, and reshaped the world.'],
  ['The Industrial Revolution Revisited', 'robert', 3, HISTORY, '978-1-110005-03-3', 759, 10, 'New scholarship on the transformation that changed everything about how we live and work.'],
  ['Women of the Renaissance', 'eleanor', 4, HISTORY, '978-1-110005-04-0', 719, 3, 'The artists, patrons, and thinkers written out of history - until now.'],
  ['The Age of Exploration', 'henry', 6, HISTORY, '978-1-110005-05-7', 689, 15, 'Ships, stars, and spice: how explorers mapped the world and remade it.'],
  ['Habits That Stick', 'priya', 5, SELF_HELP, '978-1-110006-01-6', 499, 40, 'Science-backed systems for building habits that survive busy weeks and bad days.'],
  ['Mindful Mornings', 'priya', 2, SELF_HELP, '978-1-110006-02-3', 469, 35, 'A ten-minute daily practice to start each day calm, focused, and intentional.'],
  ['The Resilience Toolkit', 'amelia', 0, SELF_HELP, '978-1-110006-03-0', 559, 24, 'Practical exercises for bouncing back from setbacks, drawn from psychology and real lives.'],
  ['Focus: The Art of Deep Work', 'rajesh', 6, SELF_HELP, '978-1-110006-04-7', 519, 2, 'How to reclaim deep focus in a world engineered for distraction.']
];

const bookIds = [];
for (const [title, authorKey, pubIndex, catId, isbn, price, stock, description] of books) {
  const authorId = authors[authorKey].lastInsertRowid;
  const cover = `https://picsum.photos/seed/booknook-${isbn.replace(/\D/g, '')}/400/560`;
  const pdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  const id = insertBook.run(title, authorId, publishers[pubIndex], catId, isbn, price, stock, description, cover, pdf).lastInsertRowid;
  bookIds.push(id);
}

insertCoupon.run('WELCOME10', 10, daysFromNow(365), 1);
insertCoupon.run('SAVE25', 25, daysFromNow(365), 1);
insertCoupon.run('HOLIDAY15', 15, daysFromNow(90), 0);
insertCoupon.run('EXPIRED20', 20, daysFromNow(-30), 1);

function placeOrder(userId, items, couponCode, status) {
  const coupon = couponCode
    ? db.prepare('SELECT * FROM coupons WHERE code = ?').get(couponCode)
    : null;
  const subtotal = items.reduce((sum, [bookId, qty, price]) => sum + price * qty, 0);
  const discount = coupon ? Math.round(subtotal * coupon.discount_percent) / 100 : 0;
  const total = Math.round((subtotal - discount) * 100) / 100;
  const orderId = insertOrder.run(userId, status, total, discount, couponCode).lastInsertRowid;
  for (const [bookId, qty, price] of items) {
    insertOrderItem.run(orderId, bookId, qty, price);
  }
  return orderId;
}

const priceOf = (i) => books[i][5];
const b1 = bookIds[0], b2 = bookIds[1], b3 = bookIds[2], b5 = bookIds[4], b9 = bookIds[8], b15 = bookIds[14];

placeOrder(john.lastInsertRowid, [[b1, 1, priceOf(0)], [b2, 2, priceOf(1)], [b15, 1, priceOf(14)]], 'WELCOME10', 'delivered');
placeOrder(jane.lastInsertRowid, [[b5, 1, priceOf(4)], [b9, 1, priceOf(8)]], 'SAVE25', 'shipped');
placeOrder(john.lastInsertRowid, [[b3, 1, priceOf(2)]], null, 'pending');

insertReview.run(john.lastInsertRowid, b1, 5, 'Beautifully written. The atmosphere stays with you long after the last page.');
insertReview.run(john.lastInsertRowid, b15, 4, 'Packed with practical examples. A bit long but worth every chapter.');
insertReview.run(jane.lastInsertRowid, b5, 5, 'My favourite read of the year - warm, strange, and unforgettable.');
insertReview.run(jane.lastInsertRowid, b9, 4, 'Explains quantum concepts without the math headache. Highly recommend.');

insertCartItem.run(john.lastInsertRowid, b3, 1);
insertCartItem.run(john.lastInsertRowid, bookIds[9], 2);
insertWishlistItem.run(john.lastInsertRowid, b5);
insertWishlistItem.run(john.lastInsertRowid, bookIds[21]);

console.log('==========================================');
console.log('  BookNook - database seeded successfully');
console.log('==========================================');
console.log(`  Users:        ${db.prepare('SELECT COUNT(*) AS n FROM users').get().n}`);
console.log(`  Authors:      ${db.prepare('SELECT COUNT(*) AS n FROM authors').get().n}`);
console.log(`  Publishers:   ${db.prepare('SELECT COUNT(*) AS n FROM publishers').get().n}`);
console.log(`  Categories:   ${db.prepare('SELECT COUNT(*) AS n FROM categories').get().n}`);
console.log(`  Books:        ${db.prepare('SELECT COUNT(*) AS n FROM books').get().n}`);
console.log(`  Orders:       ${db.prepare('SELECT COUNT(*) AS n FROM orders').get().n}`);
console.log(`  Reviews:      ${db.prepare('SELECT COUNT(*) AS n FROM reviews').get().n}`);
console.log(`  Coupons:      ${db.prepare('SELECT COUNT(*) AS n FROM coupons').get().n}`);
console.log('------------------------------------------');
console.log('  Admin:    admin@bookstore.com / Admin@123');
console.log('  Customer: john@example.com / Password@123');
console.log('  Customer: jane@example.com / Password@123');
console.log('------------------------------------------');
console.log('  Coupons:  WELCOME10 (10%), SAVE25 (25%)');
console.log('==========================================');
