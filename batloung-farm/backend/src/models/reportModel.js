const { pool } = require('../config/db');

// 1. Most frequently sold fruits (by boxes sold)
exports.topFruits = async (limit = 5) => (await pool.query(`
  SELECT f.fruit_id, f.fruit_name, SUM(sd.quantity) AS total_boxes_sold, COUNT(DISTINCT sd.sale_id) AS number_of_sales
  FROM sales_details sd JOIN fruits f ON f.fruit_id = sd.fruit_id
  GROUP BY f.fruit_id, f.fruit_name
  ORDER BY total_boxes_sold DESC, f.fruit_name LIMIT ?`, [limit]))[0];

// 2. Revenue in a date range (inclusive)
exports.revenue = async (from, to) => (await pool.query(`
  SELECT COUNT(*) AS number_of_sales, COALESCE(SUM(total_amount),0) AS total_revenue,
         COALESCE(SUM(amount_paid),0) AS total_collected
  FROM sales WHERE sale_date >= ? AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)`, [from, to]))[0][0];

// 3. Vendor with the highest number of boxes purchased
exports.topVendor = async () => (await pool.query(`
  SELECT v.vendor_id, v.vendor_name, v.phone_number, SUM(sd.quantity) AS total_boxes
  FROM sales s JOIN vendors v ON v.vendor_id = s.vendor_id JOIN sales_details sd ON sd.sale_id = s.sale_id
  GROUP BY v.vendor_id, v.vendor_name, v.phone_number
  ORDER BY total_boxes DESC, v.vendor_name LIMIT 1`))[0][0];

// 4. Current stock per fruit and packaging size
exports.stockLevels = async () => (await pool.query(`
  SELECT f.fruit_name, st.packaging_size, st.available_quantity
  FROM stock st JOIN fruits f ON f.fruit_id = st.fruit_id
  ORDER BY f.fruit_name, FIELD(st.packaging_size,'SMALL','MEDIUM','LARGE')`))[0];
