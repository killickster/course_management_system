CREATE DATABASE IF NOT EXISTS `cms`
DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci;
USE `cms`;

CREATE TABLE IF NOT EXISTS `users` (
	`user_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	`username` varchar(24) NOT NULL,
	`password` varchar(255) NOT NULL,
	`first_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
	`last_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
	`role` ENUM('admin', 'instructor', 'student') NOT NULL
);

CREATE TABLE IF NOT EXISTS `departments` (
	`dept_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	`dept_name` varchar(50) NOT NULL,
	`dept_abbv` varchar(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS `courses` (
	`course_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	`dept_id` int(11) UNSIGNED NOT NULL REFERENCES `departments`(`dept_id`),
	`course_name` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
	`course_num` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
	`course_desc` text COLLATE utf8_unicode_ci NOT NULL,
	`course_len` ENUM('full', 'half', 'short') NOT NULL
);

CREATE TABLE IF NOT EXISTS `classes` (
	`class_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	`course_id` int(11) UNSIGNED NOT NULL REFERENCES `courses`(`course_id`),
	`schoolyear` year(4) NOT NULL,
	`sect` int(11) UNSIGNED NOT NULL,
	`sect_type` ENUM('lecture', 'tutorial', 'lab') NOT NULL,
	`sess_start` ENUM('0', '1', '2', '3', '4', '5', '6', '7', '8') NOT NULL
);

CREATE TABLE IF NOT EXISTS `programs` (
	`program_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
	`program_name` varchar(50) NOT NULL,
	`program_abbv` varchar(10) NOT NULL,
	`program_desc` text COLLATE utf8_unicode_ci NOT NULL
);

CREATE TABLE IF NOT EXISTS `prereqs` (
	`course_id` int(11) UNSIGNED NOT NULL REFERENCES `courses`(`course_id`),
	`prereq_id` int(11) UNSIGNED NOT NULL REFERENCES `courses`(`course_id`)
);

CREATE TABLE IF NOT EXISTS `program_has` (
	`program_id` int(11) UNSIGNED NOT NULL REFERENCES `programs`(`program_id`),
	`course_id` int(11) UNSIGNED NOT NULL REFERENCES `courses`(`course_id`)
);

CREATE TABLE IF NOT EXISTS `has_enrolled` (
	`class_id` int(11) UNSIGNED NOT NULL REFERENCES `classes`(`class_id`),
	`student_id` int(11) UNSIGNED NOT NULL REFERENCES `users`(`user_id`)
);

CREATE TABLE IF NOT EXISTS `has_teaching` (
	`class_id` int(11) UNSIGNED NOT NULL REFERENCES `classes`(`class_id`),
	`instructor_id` int(11) UNSIGNED NOT NULL  REFERENCES `users`(`user_id`),
	`is_main` boolean
);

CREATE TABLE IF NOT EXISTS `teach_request` (
	`instructor_id` int(11) UNSIGNED NOT NULL REFERENCES `users`(`user_id`),
	`class_id` int(11) UNSIGNED NOT NULL REFERENCES `classes`(`class_id`)

);

INSERT INTO `users` (`username`, `password`, `first_name`, `last_name`, `role`) VALUES ('admin000', 'adminpass', 'John', 'Anglo', 'admin')