-- Batloung Farm Distribution System - MySQL schema
CREATE DATABASE IF NOT EXISTS batloung_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE batloung_farm;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS payments, sales_details, sales, purchase_details, purchases,
                     stock, selling_prices, fruit_prices, vendors, fruits, suppliers;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE suppliers (
  supplier_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_name  VARCHAR(120) NOT NULL UNIQUE,
  contact_person VARCHAR(100) NOT NULL,
  phone          VARCHAR(20)  NOT NULL UNIQUE,
  province       ENUM('Gauteng','Free State','KwaZulu-Natal','Western Cape',
                      'Eastern Cape','Limpopo','Mpumalanga','North West') NOT NULL,
  address        VARCHAR(255) NOT NULL,
  latitude       DECIMAL(10,7) NULL,
  longitude      DECIMAL(10,7) NULL
) ENGINE=InnoDB;

CREATE TABLE fruits (
  fruit_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fruit_name  VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB;

CREATE TABLE vendors (
  vendor_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vendor_name       VARCHAR(100) NOT NULL,
  phone_number      VARCHAR(20)  NOT NULL UNIQUE,
  location          VARCHAR(150) NOT NULL,
  registration_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  latitude          DECIMAL(10,7) NULL,
  longitude         DECIMAL(10,7) NULL
) ENGINE=InnoDB;

CREATE TABLE purchases (
  purchase_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supplier_id   INT UNSIGNED NOT NULL,
  purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT chk_purchase_total CHECK (total_amount >= 0),
  CONSTRAINT fk_purchase_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_purchase_supplier (supplier_id)
) ENGINE=InnoDB;

CREATE TABLE purchase_details (
  purchase_detail_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_id    INT UNSIGNED NOT NULL,
  fruit_id       INT UNSIGNED NOT NULL,
  packaging_size ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  quantity       INT UNSIGNED NOT NULL,
  unit_cost      DECIMAL(10,2) NOT NULL,
  CONSTRAINT chk_pd_qty  CHECK (quantity > 0),
  CONSTRAINT chk_pd_cost CHECK (unit_cost > 0),
  CONSTRAINT fk_pd_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(purchase_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pd_fruit FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE sales (
  sale_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vendor_id      INT UNSIGNED NOT NULL,
  sale_date      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_status ENUM('PAID','PARTIALLY_PAID','UNPAID') NOT NULL DEFAULT 'UNPAID',
  payment_method ENUM('CASH','MOBILE_MONEY','CREDIT') NOT NULL DEFAULT 'CASH',
  total_amount   DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid    DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT chk_sale_total CHECK (total_amount >= 0),
  CONSTRAINT chk_sale_paid  CHECK (amount_paid >= 0 AND amount_paid <= total_amount),
  CONSTRAINT fk_sale_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_sale_vendor (vendor_id),
  INDEX idx_sale_date (sale_date)
) ENGINE=InnoDB;

CREATE TABLE sales_details (
  sales_detail_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id        INT UNSIGNED NOT NULL,
  fruit_id       INT UNSIGNED NOT NULL,
  packaging_size ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  quantity       INT UNSIGNED NOT NULL,
  unit_price     DECIMAL(10,2) NOT NULL,
  CONSTRAINT chk_sd_qty   CHECK (quantity > 0),
  CONSTRAINT chk_sd_price CHECK (unit_price > 0),
  CONSTRAINT fk_sd_sale FOREIGN KEY (sale_id) REFERENCES sales(sale_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sd_fruit FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- One row per fruit AND packaging size: stock is tracked separately for small / medium / large
CREATE TABLE stock (
  stock_id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fruit_id           INT UNSIGNED NOT NULL,
  packaging_size     ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  available_quantity INT NOT NULL DEFAULT 0,
  CONSTRAINT chk_stock_non_negative CHECK (available_quantity >= 0),
  CONSTRAINT uq_stock_fruit_size UNIQUE (fruit_id, packaging_size),
  CONSTRAINT fk_stock_fruit FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Each packaging size has its own selling price per fruit
CREATE TABLE selling_prices (
  price_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fruit_id       INT UNSIGNED NOT NULL,
  packaging_size ENUM('SMALL','MEDIUM','LARGE') NOT NULL,
  unit_price     DECIMAL(10,2) NOT NULL,
  CONSTRAINT chk_price_positive CHECK (unit_price > 0),
  CONSTRAINT uq_price_fruit_size UNIQUE (fruit_id, packaging_size),
  CONSTRAINT fk_price_fruit FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Every payment received from a vendor (cash or mobile money)
CREATE TABLE payments (
  payment_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id        INT UNSIGNED NOT NULL,
  amount         DECIMAL(12,2) NOT NULL,
  payment_method ENUM('CASH','MOBILE_MONEY') NOT NULL,
  reference      VARCHAR(60) NULL,
  paid_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_payment_amount CHECK (amount > 0),
  CONSTRAINT fk_payment_sale FOREIGN KEY (sale_id) REFERENCES sales(sale_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
