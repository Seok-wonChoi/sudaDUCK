-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: prod_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `custom_item`
--

DROP TABLE IF EXISTS `custom_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_item` (
  `item_id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(30) NOT NULL,
  `item_key` varchar(50) NOT NULL,
  `price` int NOT NULL DEFAULT '0',
  `is_default_free` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `uk_custom_item` (`category`,`item_key`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `member`
--

DROP TABLE IF EXISTS `member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member` (
  `user_id` bigint NOT NULL,
  `email` varchar(100) NOT NULL,
  `name` varchar(20) NOT NULL,
  `nickname` varchar(20) NOT NULL,
  `profile_image_url` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `member_custom_item`
--

DROP TABLE IF EXISTS `member_custom_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_custom_item` (
  `member_custom_item_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `item_id` bigint NOT NULL,
  `purchased_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`member_custom_item_id`),
  UNIQUE KEY `uk_member_item` (`user_id`,`item_id`),
  KEY `fk_mci_item` (`item_id`),
  CONSTRAINT `fk_mci_item` FOREIGN KEY (`item_id`) REFERENCES `custom_item` (`item_id`),
  CONSTRAINT `fk_mci_user` FOREIGN KEY (`user_id`) REFERENCES `member` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `profile`
--

DROP TABLE IF EXISTS `profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profile` (
  `user_id` bigint NOT NULL,
  `coins` int DEFAULT NULL,
  `attendance_days` int DEFAULT NULL,
  `duck_custom_json` json DEFAULT NULL,
  `ai_duckbot_custom_json` json DEFAULT NULL,
  `avatar_custom_json` json DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `total_time` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `FK6pdekwhx3sqcedltxbj0k75yi` FOREIGN KEY (`user_id`) REFERENCES `member` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `room`
--

DROP TABLE IF EXISTS `room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room` (
  `room_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `title` varchar(30) NOT NULL,
  `topic` varchar(40) NOT NULL,
  `is_open` tinyint(1) NOT NULL DEFAULT '0',
  `turn_cnt` int NOT NULL DEFAULT '3',
  `start_time` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`room_id`),
  KEY `FK7xlpgbk1vaj41086cycyj5flq` (`user_id`),
  CONSTRAINT `FK7xlpgbk1vaj41086cycyj5flq` FOREIGN KEY (`user_id`) REFERENCES `member` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `room_participants`
--

DROP TABLE IF EXISTS `room_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_participants` (
  `participant_id` bigint NOT NULL AUTO_INCREMENT,
  `room_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `is_host` tinyint(1) NOT NULL DEFAULT '0',
  `is_left` tinyint(1) NOT NULL DEFAULT '0',
  `first_joined_at` datetime NOT NULL,
  `last_rejoined_at` datetime NOT NULL,
  PRIMARY KEY (`participant_id`),
  KEY `FKd93x26glimf3l3f05ukaoi6ry` (`room_id`),
  KEY `FKm6b67caolqk8i68ifqko3liq3` (`user_id`),
  CONSTRAINT `FKd93x26glimf3l3f05ukaoi6ry` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`),
  CONSTRAINT `FKm6b67caolqk8i68ifqko3liq3` FOREIGN KEY (`user_id`) REFERENCES `member` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sentence`
--

DROP TABLE IF EXISTS `sentence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sentence` (
  `sentence_id` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  `speaker_name` varchar(20) NOT NULL,
  `english_sentence` varchar(255) NOT NULL,
  `korean_sentence` varchar(255) NOT NULL,
  `score` int NOT NULL,
  `topic` varchar(40) DEFAULT NULL,
  `participant_list` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `similarity_phrases` text,
  `tts_url` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`sentence_id`),
  KEY `FKf740m2dl4fany090ylrn3k874` (`user_id`),
  CONSTRAINT `FKf740m2dl4fany090ylrn3k874` FOREIGN KEY (`user_id`) REFERENCES `member` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'prod_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-08 19:13:42
