CREATE DATABASE IF NOT EXISTS `aula-db`;
USE `aula-db`;

CREATE TABLE IF NOT EXISTS produto (
  id INT AUTO_INCREMENT,
  descricao VARCHAR(50) NOT NULL,
  categoria VARCHAR(10) NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  criado_em DATETIME DEFAULT NOW(),
  criado_por VARCHAR(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE(descricao, criado_por)
);

CREATE USER IF NOT EXISTS 'repl'@'%' IDENTIFIED BY 'replpass';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';

CREATE USER IF NOT EXISTS 'replicuser'@'%' IDENTIFIED BY 'grupof.pass';
GRANT SELECT ON `aula-db`.* TO 'replicuser'@'%';

FLUSH PRIVILEGES;
